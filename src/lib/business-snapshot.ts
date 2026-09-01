import { createClient } from "@/lib/supabase/server"

export type BusinessSnapshot = {
  businessName: string
  currencyCode: string
  datasetCount: number
  rowCount: number
  latestDate: string | null
  revenue: number
  previousRevenue: number
  revenueChange: number | null
  orders: number
  units: number
  averageOrderValue: number
  returns: number
  customers: number
  lowStock: number
  outOfStock: number
  suppliers: number
  riskySuppliers: number
  inventoryValue: number
  topProduct: { name: string; revenue: number } | null
  signals: Array<{
    id: string
    priority: "high" | "medium" | "low"
    title: string
    why: string
    action: string
    evidence: string
  }>
}

type Row = Record<string, unknown>
type StoredRow = { dataset_id: string; row_number: number; row_data: unknown }
type Dataset = { id: string; name: string; file_name: string | null; row_count: number | null; status: string; created_at: string }

const text = (value: unknown) => value == null ? "" : String(value).trim()

const num = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  const parsed = Number(text(value).replace(/[₹$€£,%\s]/g, ""))
  return Number.isFinite(parsed) ? parsed : 0
}

const norm = (value: string) => value.toLowerCase().replace(/[\s_-]+/g, "")

function keyOf(row: Row, aliases: string[]) {
  const keys = Object.keys(row)
  const map = new Map(keys.map((key) => [norm(key), key]))
  for (const alias of aliases) {
    const key = map.get(norm(alias))
    if (key) return key
  }
  return null
}

function parseDate(value: unknown) {
  const raw = text(value)
  if (!raw) return null
  const match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (match) return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function datasetLabel(dataset: Dataset) {
  return `${dataset.name} ${dataset.file_name ?? ""}`.toLowerCase()
}

function rowsFor(datasets: Dataset[], rows: Array<{ datasetId: string; row: Row }>, terms: string[]) {
  const ids = new Set(
    datasets.filter((dataset) => terms.some((term) => datasetLabel(dataset).includes(term))).map((dataset) => dataset.id)
  )
  return rows.filter((item) => ids.has(item.datasetId))
}

export async function getBusinessSnapshot(): Promise<BusinessSnapshot> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("AUTH_REQUIRED")
  }

  const { data: membership, error: membershipError } = await supabase
    .from("business_users")
    .select("business_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  if (membershipError) throw new Error(membershipError.message)
  if (!membership) throw new Error("BUSINESS_REQUIRED")

  const [{ data: business, error: businessError }, { data: datasets, error: datasetsError }] = await Promise.all([
    supabase.from("businesses").select("name,currency_code").eq("id", membership.business_id).single(),
    supabase.from("datasets").select("id,name,file_name,row_count,status,created_at").eq("business_id", membership.business_id).eq("status", "ready").order("created_at", { ascending: false }).limit(50),
  ])

  if (businessError || !business) throw new Error(businessError?.message || "Business could not be loaded.")
  if (datasetsError) throw new Error(datasetsError.message)

  const ready = (datasets ?? []) as Dataset[]
  const ids = ready.map((item) => item.id)

  const { data: stored, error: rowsError } = ids.length
    ? await supabase.from("dataset_rows").select("dataset_id,row_number,row_data").eq("business_id", membership.business_id).in("dataset_id", ids).order("row_number", { ascending: true })
    : { data: [], error: null }

  if (rowsError) throw new Error(rowsError.message)

  const rows = ((stored ?? []) as StoredRow[]).map((item) => ({
    datasetId: item.dataset_id,
    row: (item.row_data ?? {}) as Row,
  }))

  const orderRows = rows.filter(({ row }) => Boolean(keyOf(row, ["order_id", "orderid", "order"]) && keyOf(row, ["revenue", "sales", "amount", "total"])))
  const inventoryRows = rowsFor(ready, rows, ["inventory", "stock", "warehouse"]).filter(({ row }) => Boolean(keyOf(row, ["product_id", "product", "sku", "item"]) && keyOf(row, ["stock_qty", "stock", "quantity_in_stock", "inventory", "quantity"])))
  const supplierRows = rowsFor(ready, rows, ["supplier", "vendor"]).filter(({ row }) => Boolean(keyOf(row, ["supplier_id", "supplier", "supplier_name", "vendor"])))
  const customerRows = rowsFor(ready, rows, ["customer", "client"])
  const productRows = rowsFor(ready, rows, ["product", "catalog", "items"])

  const order = orderRows[0]?.row
  const revenueKey = order ? keyOf(order, ["revenue", "sales", "amount", "total"]) : null
  const quantityKey = order ? keyOf(order, ["quantity", "qty", "units"]) : null
  const dateKey = order ? keyOf(order, ["order_date", "transaction_date", "date", "created_at"]) : null
  const productKey = order ? keyOf(order, ["product_id", "product", "sku", "item"]) : null
  const customerKey = order ? keyOf(order, ["customer_id", "customer", "customer_name"]) : null
  const statusKey = order ? keyOf(order, ["order_status", "status"]) : null
  const channelKey = order ? keyOf(order, ["sales_channel", "channel"]) : null

  const excluded = new Set(["cancelled", "canceled", "returned", "refunded"])
  const activeOrders = orderRows.filter(({ row }) => !excluded.has(statusKey ? text(row[statusKey]).toLowerCase() : ""))

  const revenue = activeOrders.reduce((sum, item) => sum + (revenueKey ? num(item.row[revenueKey]) : 0), 0)
  const orders = activeOrders.length
  const units = activeOrders.reduce((sum, item) => sum + (quantityKey ? num(item.row[quantityKey]) : 0), 0)
  const averageOrderValue = orders ? revenue / orders : 0
  const returns = orderRows.length - activeOrders.length

  const dates = activeOrders.map(({ row }) => dateKey ? parseDate(row[dateKey]) : null).filter((value): value is string => Boolean(value)).sort()
  const latestDate = dates.at(-1) ?? null
  const currentStart = latestDate ? addDays(latestDate, -29) : null
  const previousEnd = currentStart ? addDays(currentStart, -1) : null
  const previousStart = previousEnd ? addDays(previousEnd, -29) : null

  const rangeRevenue = (start: string | null, end: string | null) => {
    if (!start || !end || !dateKey || !revenueKey) return 0
    return activeOrders.reduce((sum, item) => {
      const d = parseDate(item.row[dateKey])
      return d && d >= start && d <= end ? sum + num(item.row[revenueKey]) : sum
    }, 0)
  }

  const currentRevenue = rangeRevenue(currentStart, latestDate)
  const previousRevenue = rangeRevenue(previousStart, previousEnd)
  const revenueChange = previousRevenue === 0 ? (currentRevenue > 0 ? null : 0) : ((currentRevenue - previousRevenue) / previousRevenue) * 100

  const customerIds = new Set<string>()
  activeOrders.forEach(({ row }) => {
    if (customerKey) {
      const value = text(row[customerKey])
      if (value) customerIds.add(value)
    }
  })
  customerRows.forEach(({ row }) => {
    const key = keyOf(row, ["customer_id", "customer", "customer_name", "id"])
    if (key && text(row[key])) customerIds.add(text(row[key]))
  })

  const lowStockRows = inventoryRows.filter(({ row }) => {
    const stockKey = keyOf(row, ["stock_qty", "stock", "quantity_in_stock", "inventory", "quantity"])
    return stockKey && num(row[stockKey]) <= 10
  })
  const outOfStockRows = lowStockRows.filter(({ row }) => {
    const stockKey = keyOf(row, ["stock_qty", "stock", "quantity_in_stock", "inventory", "quantity"])
    return stockKey && num(row[stockKey]) <= 0
  })

  const inventoryValue = inventoryRows.reduce((sum, { row }) => {
    const stockKey = keyOf(row, ["stock_qty", "stock", "quantity_in_stock", "inventory", "quantity"])
    const costKey = keyOf(row, ["unit_cost", "cost", "cost_price", "purchase_price"])
    return sum + (stockKey && costKey ? num(row[stockKey]) * num(row[costKey]) : 0)
  }, 0)

  const supplierLeadKey = supplierRows[0] ? keyOf(supplierRows[0].row, ["lead_time", "lead_time_days", "delivery_days", "days_to_deliver"]) : null
  const riskySuppliers = supplierRows.filter(({ row }) => supplierLeadKey ? num(row[supplierLeadKey]) >= 10 : false).length

  const productTotals = new Map<string, number>()
  activeOrders.forEach(({ row }) => {
    if (!productKey || !revenueKey) return
    const product = text(row[productKey]) || "Unknown product"
    productTotals.set(product, (productTotals.get(product) ?? 0) + num(row[revenueKey]))
  })
  const topProductEntry = [...productTotals.entries()].sort((a, b) => b[1] - a[1])[0]
  const topProduct = topProductEntry ? { name: topProductEntry[0], revenue: topProductEntry[1] } : null

  const signals: BusinessSnapshot["signals"] = []

  if (lowStockRows.length > 0) {
    signals.push({
      id: "inventory-pressure",
      priority: outOfStockRows.length > 0 ? "high" : "medium",
      title: outOfStockRows.length > 0 ? "Stock-outs need attention." : "Inventory pressure is building.",
      why: `${lowStockRows.length} inventory record${lowStockRows.length === 1 ? "" : "s"} are at or below the low-stock threshold.`,
      action: "Review replenishment for the affected products.",
      evidence: `${outOfStockRows.length} out of stock · ${lowStockRows.length} low stock`,
    })
  }

  if (riskySuppliers > 0) {
    signals.push({
      id: "supplier-risk",
      priority: "medium",
      title: "Supplier lead-time risk is visible.",
      why: `${riskySuppliers} supplier record${riskySuppliers === 1 ? "" : "s"} show a lead time of 10 days or more.`,
      action: "Review upcoming purchase orders and supplier alternatives.",
      evidence: `${riskySuppliers} high-lead-time suppliers`,
    })
  }

  if (revenueChange !== null && revenueChange <= -10) {
    signals.push({
      id: "revenue-decline",
      priority: "high",
      title: "Revenue has declined materially.",
      why: `The latest 30-day revenue is ${Math.abs(revenueChange).toFixed(1)}% below the previous 30-day period.`,
      action: "Investigate product, channel, and customer drivers before the next planning cycle.",
      evidence: `${Math.abs(revenueChange).toFixed(1)}% decrease`,
    })
  } else if (revenueChange !== null && revenueChange >= 10) {
    signals.push({
      id: "revenue-growth",
      priority: "low",
      title: "Revenue momentum is positive.",
      why: `The latest 30-day revenue is ${revenueChange.toFixed(1)}% above the previous 30-day period.`,
      action: "Check whether inventory and supplier capacity can support the momentum.",
      evidence: `${revenueChange.toFixed(1)}% increase`,
    })
  }

  if (returns > 0) {
    signals.push({
      id: "returns",
      priority: returns / Math.max(orderRows.length, 1) >= 0.1 ? "high" : "medium",
      title: "Returns are affecting order activity.",
      why: `${returns} connected order row${returns === 1 ? "" : "s"} are marked returned, cancelled, or refunded.`,
      action: "Review the affected products and return reasons before scaling demand.",
      evidence: `${returns} excluded rows`,
    })
  }

  if (!signals.length) {
    signals.push({
      id: "ready",
      priority: "low",
      title: "No high-priority signal detected.",
      why: "The connected data does not currently trigger Nexora's deterministic watch rules.",
      action: "Keep monitoring the next data refresh.",
      evidence: `${orders} active orders across ${ready.length} dataset${ready.length === 1 ? "" : "s"}`,
    })
  }

  return {
    businessName: business.name,
    currencyCode: business.currency_code || "INR",
    datasetCount: ready.length,
    rowCount: rows.length,
    latestDate,
    revenue,
    previousRevenue,
    revenueChange,
    orders,
    units,
    averageOrderValue,
    returns,
    customers: customerIds.size,
    lowStock: lowStockRows.length,
    outOfStock: outOfStockRows.length,
    suppliers: supplierRows.length,
    riskySuppliers,
    inventoryValue,
    topProduct,
    signals,
  }
}
