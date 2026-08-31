import { redirect } from "next/navigation"

import Breadcrumbs from "@/components/layout/Breadcrumbs"
import DashboardOverview from "@/components/dashboard/DashboardOverview"
import { createClient } from "@/lib/supabase/server"

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

function addDays(date: string, days: number) {
  const result = new Date(`${date}T00:00:00`)
  result.setDate(result.getDate() + days)
  return result.toISOString().slice(0, 10)
}

function formatLabel(date: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(
    new Date(`${date}T00:00:00`)
  )
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

  const [{ data: business, error: businessError }, { data: datasets, error: datasetsError }] =
    await Promise.all([
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

  const rows = (storedRows ?? []).map((item) => ({
    datasetId: item.dataset_id as string,
    rowNumber: item.row_number as number,
    row: (item.row_data ?? {}) as JsonRow,
  }))

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

  const completedRows = orderRows.filter(({ row }) => {
    const status = statusKey ? textValue(row[statusKey]).toLowerCase() : ""
    return !status || !["returned", "cancelled", "canceled", "refunded"].includes(status)
  })

  const revenue = completedRows.reduce((sum, item) => sum + (revenueKey ? numberValue(item.row[revenueKey]) : 0), 0)
  const ordersCount = completedRows.length
  const unitsSold = completedRows.reduce((sum, item) => sum + (quantityKey ? numberValue(item.row[quantityKey]) : 0), 0)
  const averageOrderValue = ordersCount ? revenue / ordersCount : 0

  const dailyRevenue = new Map<string, number>()
  completedRows.forEach(({ row }) => {
    const date = dateKey ? parseDate(row[dateKey]) : null
    if (date) dailyRevenue.set(date, (dailyRevenue.get(date) ?? 0) + (revenueKey ? numberValue(row[revenueKey]) : 0))
  })

  const dates = [...dailyRevenue.keys()].sort()
  const endDate = dates.at(-1) ?? new Date().toISOString().slice(0, 10)
  const startDate = addDays(endDate, -29)
  const trend = Array.from({ length: 30 }, (_, index) => {
    const date = addDays(startDate, index)
    return { label: formatLabel(date), value: dailyRevenue.get(date) ?? 0 }
  })

  const productTotals = new Map<string, number>()
  completedRows.forEach(({ row }) => {
    if (!productKey || !revenueKey) return
    const product = textValue(row[productKey]) || "Unknown product"
    productTotals.set(product, (productTotals.get(product) ?? 0) + numberValue(row[revenueKey]))
  })
  const topProducts = [...productTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }))

  const returnsCount = orderRows.length - completedRows.length
  const topProductShare = revenue && topProducts[0] ? topProducts[0].value / revenue : 0

  const recentOrders = [...completedRows]
    .sort((a, b) => b.rowNumber - a.rowNumber)
    .slice(0, 6)
    .map(({ row, rowNumber }) => ({
      orderNumber: textValue(orderRows[0] && findKey(row, ["order_id", "orderid", "order"]) ? row[findKey(row, ["order_id", "orderid", "order"])!] : "") || `ROW-${rowNumber}`,
      customer: customerKey ? textValue(row[customerKey]) || "Unknown customer" : "—",
      amount: revenueKey ? numberValue(row[revenueKey]) : 0,
      status: statusKey ? textValue(row[statusKey]) || "Completed" : "Completed",
      date: dateKey ? parseDate(row[dateKey]) ?? endDate : endDate,
    }))

  const insight = revenue
    ? topProductShare >= 0.35
      ? {
        title: "Revenue is concentrated in a small number of products.",
        description: `${topProducts[0]?.name ?? "Your top product"} contributes ${Math.round(topProductShare * 100)}% of connected revenue. This is a concentration signal worth watching.`,
        evidence: `${formatLabel(endDate)} · ${Math.round(topProductShare * 100)}% of revenue`,
      }
      : returnsCount
        ? {
          title: "Returns are visible in the connected order data.",
          description: `${returnsCount} of ${orderRows.length} connected order rows are marked as returned, cancelled, or refunded.`,
          evidence: `${returnsCount} returned / cancelled rows`,
        }
        : {
          title: "Your connected orders are ready for analysis.",
          description: `${ordersCount.toLocaleString("en-IN")} completed order rows currently contribute to the dashboard.`,
          evidence: `${ordersCount.toLocaleString("en-IN")} completed orders`,
        }
    : {
      title: "Connect an orders dataset to unlock the overview.",
      description: "Nexora will calculate revenue, orders, trends and business signals directly from connected data.",
      evidence: "No compatible order dataset detected",
    }

  const datasetName = (datasetId: string) => {
    const dataset = readyDatasets.find((item) => item.id === datasetId)
    return `${dataset?.name ?? ""} ${dataset?.file_name ?? ""}`.toLowerCase()
  }

  const rowsFor = (terms: string[]) =>
    rows.filter(({ datasetId, row }) => {
      const name = datasetName(datasetId)
      const keys = Object.keys(row).join(" ").toLowerCase()
      return terms.some((term) => name.includes(term) || keys.includes(term))
    })

  const inventoryRows = rowsFor(["inventory", "stock", "warehouse"])
  const supplierRows = rowsFor(["supplier", "vendor"])
  const customerRows = rowsFor(["customer", "account"])
  const productRows = rowsFor(["product", "catalog", "sku"])
  const financeRows = rowsFor(["finance", "expense", "invoice", "profit"])

  const firstRow = (items: typeof rows) => items[0]?.row ?? null
  const keyFrom = (items: typeof rows, aliases: string[]) => {
    const sample = firstRow(items)
    return sample ? findKey(sample, aliases) : null
  }

  const inventoryQtyKey = keyFrom(inventoryRows, [
    "quantity",
    "stock_qty",
    "stock",
    "available_qty",
    "on_hand",
  ])
  const inventoryValueKey = keyFrom(inventoryRows, [
    "inventory_value",
    "stock_value",
    "value",
    "amount",
  ])
  const reorderKey = keyFrom(inventoryRows, [
    "reorder_point",
    "reorder_level",
    "minimum_stock",
    "min_stock",
  ])

  const inventoryValue = inventoryRows.reduce(
    (sum, item) =>
      sum + (inventoryValueKey ? numberValue(item.row[inventoryValueKey]) : 0),
    0
  )
  const inventoryCount = inventoryRows.length
  const lowStockCount = inventoryRows.filter(({ row }) => {
    if (!inventoryQtyKey || !reorderKey) return false
    return numberValue(row[inventoryQtyKey]) <= numberValue(row[reorderKey])
  }).length

  const supplierStatusKey = keyFrom(supplierRows, ["status", "supplier_status"])
  const supplierLeadKey = keyFrom(supplierRows, [
    "lead_time",
    "lead_time_days",
    "delivery_days",
  ])
  const atRiskSuppliers = supplierRows.filter(({ row }) => {
    const status = supplierStatusKey
      ? textValue(row[supplierStatusKey]).toLowerCase()
      : ""
    const leadTime = supplierLeadKey ? numberValue(row[supplierLeadKey]) : 0
    return ["watch", "at risk", "risk", "delayed", "poor"].some((term) =>
      status.includes(term)
    ) || leadTime >= 10
  }).length

  const supplierCount = supplierRows.length
  const customerIdKey = keyFrom(customerRows, [
    "customer_id",
    "customer",
    "account_id",
    "account",
  ])
  const customersFromOrders = new Set(
    completedRows
      .map(({ row }) => (customerKey ? textValue(row[customerKey]) : ""))
      .filter(Boolean)
  ).size
  const customerCount = customerRows.length
    ? new Set(
      customerRows
        .map(({ row }) => (customerIdKey ? textValue(row[customerIdKey]) : ""))
        .filter(Boolean)
    ).size || customerRows.length
    : customersFromOrders

  const financeRevenueKey = keyFrom(financeRows, ["revenue", "sales", "income"])
  const cogsKey = keyFrom(financeRows, ["cogs", "cost_of_goods", "cost_of_sales"])
  const expenseKey = keyFrom(financeRows, [
    "operating_expenses",
    "operating_expense",
    "expenses",
    "expense",
  ])
  const financeRevenue = financeRows.reduce(
    (sum, item) => sum + (financeRevenueKey ? numberValue(item.row[financeRevenueKey]) : 0),
    0
  )
  const cogs = financeRows.reduce(
    (sum, item) => sum + (cogsKey ? numberValue(item.row[cogsKey]) : 0),
    0
  )
  const operatingExpenses = financeRows.reduce(
    (sum, item) =>
      sum + (expenseKey ? numberValue(item.row[expenseKey]) : 0),
    0
  )
  const financeGrossProfit = financeRevenue - cogs

  const connected = {
    products: productRows.length > 0,
    inventory: inventoryRows.length > 0,
    suppliers: supplierRows.length > 0,
    customers: customerRows.length > 0 || customersFromOrders > 0,
    finance: financeRows.length > 0,
  }

  const data = {
    currencyCode: business.currency_code || "INR",
    hasData: rows.length > 0,
    revenue,
    ordersCount,
    unitsSold,
    averageOrderValue,
    inventoryValue,
    inventoryCount,
    lowStockCount,
    suppliersCount: supplierCount,
    customersCount: customerCount,
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
    grossProfit: financeRows.length ? financeGrossProfit : 0,
    connected,
    insight,
  }

  return (
    <main className="min-h-screen bg-[#F1F0F8]">
      <header className="border-b border-[#E7E4EF] bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#433D8B]">Nexora</p>
            <p className="mt-1 text-base font-semibold text-[#17153B]">{business.name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#433D8B]">{user.email}</p>
            <p className="mt-1 text-[10px] capitalize text-[#68647A]">{membership.role}</p>
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
