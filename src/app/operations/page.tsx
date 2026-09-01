import { redirect } from "next/navigation"
import OperationsOverview from "@/components/operations/OperationsOverview"
import { createClient } from "@/lib/supabase/server"

type Row = Record<string, unknown>

const aliases = {
  orderId: ["order_id", "orderid", "order"],
  revenue: ["revenue", "amount", "sales", "total"],
  quantity: ["quantity", "qty", "units"],
  date: ["order_date", "transaction_date", "date", "created_at"],
  product: ["product_id", "product", "sku", "item"],
  status: ["order_status", "status"],
  channel: ["sales_channel", "channel"],
  customer: ["customer_id", "customer", "customer_name"],
  supplier: ["supplier_id", "supplier", "supplier_name"],
  stock: ["stock_qty", "stock", "quantity_in_stock", "inventory"],
  leadTime: ["lead_time", "lead_time_days", "delivery_days", "days_to_deliver"],
}

function keyOf(row: Row, names: string[]) {
  const normalized = new Map(
    Object.keys(row).map((key) => [
      key.toLowerCase().replace(/[\s_-]+/g, ""),
      key,
    ])
  )
  return names
    .map((name) => normalized.get(name.toLowerCase().replace(/[\s_-]+/g, "")))
    .find(Boolean) ?? null
}

function text(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim()
}

function num(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  const parsed = Number(text(value).replace(/[₹$€£,\s]/g, ""))
  return Number.isFinite(parsed) ? parsed : 0
}

function date(value: unknown) {
  const raw = text(value)
  if (!raw) return null
  const match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (match) return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
}


export default async function OperationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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
        .select("id, name, currency_code")
        .eq("id", membership.business_id)
        .single(),
      supabase
        .from("datasets")
        .select("id, name, file_name, row_count, status")
        .eq("business_id", membership.business_id)
        .eq("status", "ready")
        .order("created_at", { ascending: false }),
    ])

  if (businessError || !business) {
    throw new Error(businessError?.message || "Business could not be loaded.")
  }
  if (datasetsError) throw new Error(datasetsError.message)

  const ready = datasets ?? []
  const ids = ready.map((item) => item.id)

  const { data: stored, error: rowsError } = ids.length
    ? await supabase
        .from("dataset_rows")
        .select("dataset_id, row_number, row_data")
        .eq("business_id", membership.business_id)
        .in("dataset_id", ids)
        .order("row_number", { ascending: true })
    : { data: [], error: null }

  if (rowsError) throw new Error(rowsError.message)

  const rows = (stored ?? []).map((item) => ({
    datasetId: item.dataset_id as string,
    row: (item.row_data ?? {}) as Row,
  }))

  const orderRows = rows.filter(({ row }) =>
    Boolean(keyOf(row, aliases.orderId) && keyOf(row, aliases.revenue))
  )
  const inventoryRows = rows.filter(({ row }) =>
    Boolean(keyOf(row, aliases.product) && keyOf(row, aliases.stock))
  )
  const supplierRows = rows.filter(({ row }) =>
    Boolean(keyOf(row, aliases.supplier))
  )

  const order = orderRows[0]?.row
  const revenueKey = order ? keyOf(order, aliases.revenue) : null
  const statusKey = order ? keyOf(order, aliases.status) : null
  const dateKey = order ? keyOf(order, aliases.date) : null
  const quantityKey = order ? keyOf(order, aliases.quantity) : null
  const productKey = order ? keyOf(order, aliases.product) : null
  const channelKey = order ? keyOf(order, aliases.channel) : null

  const cancelledStatuses = ["cancelled", "canceled", "returned", "refunded"]
  const activeOrders = orderRows.filter(({ row }) => {
    const status = statusKey ? text(row[statusKey]).toLowerCase() : ""
    return !cancelledStatuses.includes(status)
  })

  const pending = orderRows.filter(({ row }) => {
    const status = statusKey ? text(row[statusKey]).toLowerCase() : ""
    return ["pending", "processing", "packed", "ready", "awaiting shipment"].includes(status)
  }).length

  const cancelled = orderRows.length - activeOrders.length
  const units = activeOrders.reduce((sum, item) => sum + (quantityKey ? num(item.row[quantityKey]) : 0), 0)
  const revenue = activeOrders.reduce((sum, item) => sum + (revenueKey ? num(item.row[revenueKey]) : 0), 0)

  const dates = activeOrders
    .map(({ row }) => dateKey ? date(row[dateKey]) : null)
    .filter((value): value is string => Boolean(value))
    .sort()

  const channelTotals = new Map<string, number>()
  activeOrders.forEach(({ row }) => {
    if (!channelKey || !revenueKey) return
    const channel = text(row[channelKey]) || "Unknown"
    channelTotals.set(channel, (channelTotals.get(channel) ?? 0) + num(row[revenueKey]))
  })

  const topChannels = [...channelTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, value]) => ({ name, value }))

  const lowStock = inventoryRows.filter(({ row }) => {
    const stockKey = keyOf(row, aliases.stock)
    return stockKey && num(row[stockKey]) <= 10
  }).length

  const outOfStock = inventoryRows.filter(({ row }) => {
    const stockKey = keyOf(row, aliases.stock)
    return stockKey && num(row[stockKey]) <= 0
  }).length

  const supplierLeadKey = supplierRows[0] ? keyOf(supplierRows[0].row, aliases.leadTime) : null
  const supplierRisk = supplierRows.filter(({ row }) =>
    supplierLeadKey ? num(row[supplierLeadKey]) >= 10 : false
  ).length

  const products = new Map<string, { units: number; revenue: number }>()
  activeOrders.forEach(({ row }) => {
    if (!productKey) return
    const product = text(row[productKey]) || "Unknown product"
    const current = products.get(product) ?? { units: 0, revenue: 0 }
    current.units += quantityKey ? num(row[quantityKey]) : 0
    current.revenue += revenueKey ? num(row[revenueKey]) : 0
    products.set(product, current)
  })

  const productPressure = [...products.entries()]
    .map(([name, values]) => {
      const matchingInventory = inventoryRows.find(({ row }) => {
        const key = keyOf(row, aliases.product)
        return key && text(row[key]) === name
      })
      const stockKey = matchingInventory ? keyOf(matchingInventory.row, aliases.stock) : null
      const stock = matchingInventory && stockKey ? num(matchingInventory.row[stockKey]) : null
      return { name, units: values.units, revenue: values.revenue, stock }
    })
    .filter((item) => item.stock !== null && item.stock <= 10)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const insight =
    lowStock > 0 && productPressure.length > 0
      ? {
          title: "Demand and stock pressure are overlapping.",
          description: `${productPressure[0].name} is a revenue-driving product with only ${productPressure[0].stock} units in the connected inventory data.`,
          evidence: `${lowStock} low-stock inventory records`,
        }
      : supplierRisk > 0
        ? {
            title: "Supplier lead-time risk is visible.",
            description: `${supplierRisk} supplier records show a lead time of 10 days or more. Keep these suppliers in view when planning fulfilment.`,
            evidence: `${supplierRisk} high-lead-time suppliers`,
          }
        : pending > 0
          ? {
              title: "There are orders waiting in the fulfilment flow.",
              description: `${pending} connected orders are marked pending or in processing states.`,
              evidence: `${pending} pending / processing orders`,
            }
          : {
              title: "Operations are ready for deeper analysis.",
              description: "Connect inventory and supplier datasets to let Nexora correlate demand with operational risk.",
              evidence: `${ready.length} ready dataset${ready.length === 1 ? "" : "s"}`,
            }

  const inventoryValue = inventoryRows.reduce((sum, item) => {
    const stockKey = keyOf(item.row, aliases.stock)
    const price = keyOf(item.row, ["cost", "unit_cost", "price"])
    return sum + (stockKey && price ? num(item.row[stockKey]) * num(item.row[price]) : 0)
  }, 0)

  return (
    <main className="min-h-screen bg-[#F1F0F8]">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <OperationsOverview
          businessName={business.name}
          currencyCode={business.currency_code || "INR"}
          data={{
            orderCount: orderRows.length,
            activeOrders: activeOrders.length,
            pending,
            cancelled,
            units,
            revenue,
            lowStock,
            outOfStock,
            inventoryCount: inventoryRows.length,
            inventoryValue,
            supplierCount: new Set(supplierRows.map(({ row }) => {
              const key = keyOf(row, aliases.supplier)
              return key ? text(row[key]) : ""
            }).filter(Boolean)).size,
            supplierRisk,
            topChannels,
            productPressure,
            insight,
            latestDate: dates.at(-1) ?? null,
          }}
        />
      </div>
    </main>
  )
}
