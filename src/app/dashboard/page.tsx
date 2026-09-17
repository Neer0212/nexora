import { redirect } from "next/navigation"

import Breadcrumbs from "@/components/layout/Breadcrumbs"
import DashboardOverview from "@/components/dashboard/DashboardOverview"
import { createClient } from "@/lib/supabase/server"
import { getIndustryConfig } from "@/lib/industries"
import { getDashboardSummary } from "@/lib/dashboard-data"

type JsonRow = Record<string, unknown>

function numberValue(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (typeof value === "string") {
    const cleaned = value.replace(/[₹$€£,\s]/g, "")
    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function textValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim()
}

function findKey(row: JsonRow, aliases: string[]) {
  const keys = Object.keys(row)
  const normalized = new Map(keys.map((key) => [key.toLowerCase().replace(/[\s_-]+/g, ""), key]))
  for (const alias of aliases) {
    const key = normalized.get(alias.toLowerCase().replace(/[\s_-]+/g, ""))
    if (key) return key
  }
  return null
}

function parseDate(value: unknown) {
  const text = textValue(value)
  if (!text) return null
  const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (match) return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`
  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: membership, error: membershipError } = await supabase
    .from("business_users")
    .select("business_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  if (membershipError) throw new Error(membershipError.message)
  if (!membership) redirect("/onboarding")

  // Run operational summary and data hub queries in parallel
  const [
    { data: business, error: businessError },
    { data: datasets, error: datasetsError },
    operationalSummary,
  ] = await Promise.all([
    supabase
      .from("businesses")
      .select("id, name, industry, business_type, currency_code")
      .eq("id", membership.business_id)
      .single(),
    supabase
      .from("datasets")
      .select("id, name, file_name, row_count, column_count, status, created_at")
      .eq("business_id", membership.business_id)
      .eq("status", "ready")
      .order("created_at", { ascending: false })
      .limit(20),
    // Phase 10: Authoritative operational summary
    getDashboardSummary(membership.business_id).catch(() => null),
  ])

  if (businessError || !business) {
    throw new Error(businessError?.message || "Business could not be loaded.")
  }
  if (datasetsError) throw new Error(datasetsError.message)

  const readyDatasets = datasets ?? []
  const datasetIds = readyDatasets.map((dataset) => dataset.id)

  const { data: storedRows, error: rowsError } = datasetIds.length
    ? await supabase
      .from("dataset_rows")
      .select("dataset_id, row_number, row_data")
      .eq("business_id", membership.business_id)
      .in("dataset_id", datasetIds)
      .order("row_number", { ascending: true })
    : { data: [], error: null }

  if (rowsError) throw new Error(rowsError.message)

  const parsedRows = (storedRows ?? []).map((item) => ({
    datasetId: item.dataset_id as string,
    rowNumber: item.row_number as number,
    row: (item.row_data ?? {}) as JsonRow,
  }))

  const { appendOperationalData } = await import("@/lib/pos-integration")
  const rows = await appendOperationalData(membership.business_id, parsedRows)

  const orderRows = rows.filter(({ row }) =>
    Boolean(
      findKey(row, ["order_id", "orderid", "order"]) &&
      findKey(row, ["revenue", "amount", "sales", "total"])
    )
  )

  const revenueKey = orderRows[0] ? findKey(orderRows[0].row, ["revenue", "amount", "sales", "total"]) : null
  const quantityKey = orderRows[0] ? findKey(orderRows[0].row, ["quantity", "qty", "units"]) : null
  const dateKey = orderRows[0] ? findKey(orderRows[0].row, ["order_date", "date", "transaction_date", "created_at"]) : null
  const productKey = orderRows[0] ? findKey(orderRows[0].row, ["product_id", "product", "sku", "item"]) : null
  const customerKey = orderRows[0] ? findKey(orderRows[0].row, ["customer_id", "customer", "customer_name"]) : null
  const statusKey = orderRows[0] ? findKey(orderRows[0].row, ["order_status", "status"]) : null

  // Exclude returned/cancelled rows from revenue calculations
  const completedRows = orderRows.filter(({ row }) => {
    const status = statusKey ? textValue(row[statusKey]).toLowerCase() : ""
    return !status || !["returned", "cancelled", "canceled", "refunded"].includes(status)
  })

  const unitsSold = completedRows.reduce((sum, item) => sum + (quantityKey ? numberValue(item.row[quantityKey]) : 0), 0)

  // ── Trend ──────────────────────────────────────────────────────────────────
  // Use authoritative operational trend ONLY.
  // When operationalSummary is null (getDashboardSummary failed), trend is empty.
  // We do NOT fall back to the bridge/Data Hub for the live financial chart because
  // the bridge data provenance and financial semantics cannot be guaranteed to match.
  // The empty state in DashboardOverview handles the no-data case.
  const trend: Array<{ label: string; value: number }> = operationalSummary
    ? operationalSummary.trend.map((p) => ({ label: p.label, value: p.revenue }))
    : []

  // ── Top Products ───────────────────────────────────────────────────────────
  // Authoritative if available; fallback to bridge Data Hub scan if not.
  // The bridge fallback here is acceptable because it is used only for the
  // "product name → revenue" attribution, not for financial totals.
  let topProducts: Array<{ name: string; value: number }>
  if (operationalSummary && operationalSummary.topProducts.length > 0) {
    topProducts = operationalSummary.topProducts
  } else {
    const productTotals = new Map<string, number>()
    completedRows.forEach(({ row }) => {
      if (!productKey || !revenueKey) return
      const product = textValue(row[productKey]) || "Unknown product"
      productTotals.set(product, (productTotals.get(product) ?? 0) + numberValue(row[revenueKey]))
    })
    topProducts = [...productTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }))
  }

  // ── Recent Orders ──────────────────────────────────────────────────────────
  // Authoritative if available; fallback to bridge Data Hub scan if not.
  let recentOrders: Array<{ orderNumber: string; customer: string; amount: number; status: string; date: string }>
  if (operationalSummary && operationalSummary.recentOrders.length > 0) {
    recentOrders = operationalSummary.recentOrders
  } else {
    const endDate = new Date().toISOString().slice(0, 10)
    recentOrders = [...completedRows]
      .sort((a, b) => b.rowNumber - a.rowNumber)
      .slice(0, 6)
      .map(({ row, rowNumber }) => ({
        orderNumber: textValue(orderRows[0] && findKey(row, ["order_id", "orderid", "order"]) ? row[findKey(row, ["order_id", "orderid", "order"])!] : "") || `ROW-${rowNumber}`,
        customer: customerKey ? textValue(row[customerKey]) || "Unknown customer" : "—",
        amount: revenueKey ? numberValue(row[revenueKey]) : 0,
        status: statusKey ? textValue(row[statusKey]) || "Completed" : "Completed",
        date: dateKey ? parseDate(row[dateKey]) ?? endDate : endDate,
      }))
  }

  // ── Core Revenue Metrics ───────────────────────────────────────────────────
  // Authoritative grossSales from getDashboardSummary (correct Phase 6 semantics).
  // Fallback from bridge only when operational query failed entirely (operationalSummary === null).
  const revenue = operationalSummary?.grossSales
    ?? completedRows.reduce((sum, item) => sum + (revenueKey ? numberValue(item.row[revenueKey]) : 0), 0)
  const ordersCount = operationalSummary?.orderCount ?? completedRows.length
  const averageOrderValue = ordersCount ? revenue / ordersCount : 0
  const returnsCount = operationalSummary?.returnCount ?? (orderRows.length - completedRows.length)
  const customersCount = operationalSummary?.customerCount ?? 0

  const topProductShare = revenue && topProducts[0] ? topProducts[0].value / revenue : 0

  // ── Inventory ─────────────────────────────────────────────────────────────
  // Authoritative product count and low-stock counts from getDashboardSummary.
  // Inventory value is an INDICATIVE estimate (unit_cost × stock_qty) from the
  // pos-integration bridge — it is NOT accounting-grade FIFO/LIFO valuation.
  const inventoryRows = rows.filter(({ datasetId }) => datasetId === "pos-inventory")
  const inventoryCount = operationalSummary?.productCount ?? inventoryRows.length
  const lowStockCount = operationalSummary?.lowStockCount ?? 0
  const inventoryValue = inventoryRows.reduce((sum, { row }) => {
    const qty = numberValue(row["stock_qty"])
    const cost = numberValue(row["unit_cost"])
    return sum + qty * cost
  }, 0)

  // ── Supplier Signals (Data Hub) ────────────────────────────────────────────
  const supplierRows = rows.filter(({ datasetId, row }) => {
    const name = datasetId.toLowerCase()
    const keys = Object.keys(row).join(" ").toLowerCase()
    return name.includes("supplier") || name.includes("vendor") || keys.includes("supplier") || keys.includes("vendor")
  })
  const supplierStatusKey = supplierRows[0] ? findKey(supplierRows[0].row, ["status", "supplier_status"]) : null
  const supplierLeadKey = supplierRows[0] ? findKey(supplierRows[0].row, ["lead_time", "lead_time_days", "delivery_days"]) : null
  const atRiskSuppliers = supplierRows.filter(({ row }) => {
    const status = supplierStatusKey ? textValue(row[supplierStatusKey]).toLowerCase() : ""
    const leadTime = supplierLeadKey ? numberValue(row[supplierLeadKey]) : 0
    return ["watch", "at risk", "risk", "delayed", "poor"].some((term) => status.includes(term)) || leadTime >= 10
  }).length
  const supplierCount = supplierRows.length

  // ── Finance Aggregates ─────────────────────────────────────────────────────
  // COGS is not computed — no reliable per-unit cost query in scope for Phase 10.
  // Labelling grossSales as financeRevenue for the Finance signal card fallback only.
  const financeRevenue = revenue
  const cogs = null
  const operatingExpenses = operationalSummary?.expenses ?? 0
  const grossProfit = null

  const connected = {
    products: (operationalSummary?.productCount ?? 0) > 0,
    inventory: (operationalSummary?.productCount ?? 0) > 0,
    suppliers: supplierCount > 0,
    customers: customersCount > 0,
    finance: operatingExpenses > 0 || revenue > 0,
  }

  const insight = revenue
    ? topProductShare >= 0.35
      ? {
        title: "Revenue is concentrated in a small number of products.",
        description: `${topProducts[0]?.name ?? "Your top product"} contributes ${Math.round(topProductShare * 100)}% of revenue. This is a concentration signal worth watching.`,
        evidence: `${Math.round(topProductShare * 100)}% of revenue from top product`,
      }
      : returnsCount
        ? {
          title: "Returns are visible in the order data.",
          description: `${returnsCount} order${returnsCount === 1 ? "" : "s"} returned. Net sales = Gross − Returns.`,
          evidence: `${returnsCount} returned order${returnsCount === 1 ? "" : "s"}`,
        }
        : {
          title: "Orders are being captured and recorded.",
          description: `${ordersCount.toLocaleString("en-IN")} order${ordersCount === 1 ? "" : "s"} captured this period.`,
          evidence: `${ordersCount.toLocaleString("en-IN")} order${ordersCount === 1 ? "" : "s"}`,
        }
    : {
      title: "Connect orders or start using the POS to unlock the overview.",
      description: "Nexora will calculate revenue, orders, trends and business signals from your operational data.",
      evidence: "No sales data detected yet",
    }

  const industryConfig = getIndustryConfig(business.industry)

  const data = {
    currencyCode: business.currency_code || "INR",
    industryConfig,
    hasData: revenue > 0 || rows.length > 0,
    revenue,
    ordersCount,
    unitsSold,
    averageOrderValue,
    inventoryValue,
    inventoryCount,
    lowStockCount,
    suppliersCount: supplierCount,
    customersCount,
    datasetCount: readyDatasets.length,
    readyDatasetCount: readyDatasets.length,
    trend,
    recentOrders,
    events: [],
    topProducts,
    returnsCount,
    atRiskSuppliers,
    financeRevenue,
    cogs,
    operatingExpenses,
    grossProfit,
    connected,
    insight,
    // Phase 10: authoritative operational metrics passed to DashboardOverview
    ops: operationalSummary
      ? {
          netSales: operationalSummary.netSales,
          returns: operationalSummary.returns,
          grossPaymentsCollected: operationalSummary.grossPaymentsCollected,
          refundsIssued: operationalSummary.refundsIssued,
          netPaymentsCollected: operationalSummary.netPaymentsCollected,
          expenses: operationalSummary.expenses,
          outOfStockCount: operationalSummary.outOfStockCount,
          pendingPurchases: operationalSummary.pendingPurchases,
          partiallyReceived: operationalSummary.partiallyReceived,
          receivedPurchases: operationalSummary.receivedPurchases,
        }
      : null,
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-medium text-blue-600">Nexora</p>
            <p className="mt-1 text-base font-semibold text-zinc-950">{business.name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-blue-600">{user.email}</p>
            <p className="mt-1 text-[10px] capitalize text-zinc-500">{membership.role}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: "Business overview" }]} />
        <DashboardOverview data={data} />
      </div>
    </main>
  )
}
