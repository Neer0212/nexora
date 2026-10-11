import { createClient } from "@/lib/supabase/server"
import { getIndustryConfig } from "./industries"

import type { IndustryConfig } from "./industries"

export type BusinessSnapshot = {
  businessName: string
  currencyCode: string
  industryConfig: IndustryConfig
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
    supabase.from("businesses").select("name,currency_code,industry").eq("id", membership.business_id).single(),
    supabase.from("datasets").select("id,name,file_name,row_count,status,created_at").eq("business_id", membership.business_id).eq("status", "ready").order("created_at", { ascending: false }).limit(50),
  ])

  if (businessError || !business) throw new Error(businessError?.message || "Business could not be loaded.")
  if (datasetsError) throw new Error(datasetsError.message)

  const ready = (datasets ?? []) as Dataset[]

  let rawRows: Array<{ row_id?: string; dataset_id: string; row_data: unknown }> = []
  if (ready.length > 0) {
    const { data, error: rowsError } = await supabase
      .from("dataset_rows")
      .select("row_id, dataset_id, row_data")
      .in("dataset_id", ready.map(d => d.id))

    if (rowsError) {
      throw new Error(`Failed to load dataset rows: ${rowsError.message}`)
    }
    rawRows = (data ?? []) as Array<{ row_id?: string; dataset_id: string; row_data: unknown }>
  }

  const rows = (rawRows || []).map(item => ({
    datasetId: item.dataset_id,
    row: (item.row_data ?? {}) as Row,
  }))

  // Phase 6: Integrate POS operational data natively into the Intelligence layer
  const { data: posOrders } = await supabase
    .from("orders")
    .select(`
      id, order_number, order_date, total_amount, status,
      customer:customers(name),
      items:order_items(quantity, unit_price, total_amount, product_name_snapshot)
    `)
    .eq("business_id", membership.business_id)

  if (posOrders) {
    posOrders.forEach(o => {
      const customerName = (o.customer as { name?: string })?.name || "Walk-in"
      if (o.items && o.items.length > 0) {
        // Create one row per order item so each product gets proper attribution
        o.items.forEach((item: { quantity?: number, unit_price?: number, total_amount?: number, product_name_snapshot?: string }) => {
          const qty = Number(item.quantity) || 0
          const unitPrice = Number(item.unit_price) || 0
          const lineTotal = Number(item.total_amount) || (unitPrice * qty)
          rows.push({
            datasetId: "pos-system",
            row: {
              order_id: o.order_number,
              revenue: lineTotal,
              date: o.order_date,
              status: o.status,
              units: qty,
              customer_name: customerName,
              product: item.product_name_snapshot || "Unknown Product"
            }
          })
        })
      } else {
        // Fallback for orders with no items (shouldn't happen but be safe)
        rows.push({
          datasetId: "pos-system",
          row: {
            order_id: o.order_number,
            revenue: o.total_amount,
            date: o.order_date,
            status: o.status,
            units: 0,
            customer_name: customerName,
            product: "Unknown Product"
          }
        })
      }
    })
  }

  const { data: posProducts } = await supabase
    .from("products")
    .select("id, name, stock_quantity, low_stock_threshold, unit_cost")
    .eq("business_id", membership.business_id)

  if (posProducts) {
    posProducts.forEach(p => {
      rows.push({
        datasetId: "pos-system",
        row: {
          product: p.name,
          stock_qty: p.stock_quantity ?? 0,
          unit_cost: p.unit_cost ?? 0
        }
      })
    })
  }

  const { data: posCustomers } = await supabase
    .from("customers")
    .select("id, name")
    .eq("business_id", membership.business_id)

  if (posCustomers) {
    posCustomers.forEach(c => {
      rows.push({
        datasetId: "pos-system",
        row: {
          customer_name: c.name
        }
      })
    })
  }

  // Integrate POS expenses into intelligence
  const { data: posExpenses } = await supabase
    .from("expenses")
    .select("id, category, amount, expense_date")
    .eq("business_id", membership.business_id)

  if (posExpenses) {
    posExpenses.forEach(e => {
      rows.push({
        datasetId: "pos-system",
        row: {
          expense_category: e.category,
          amount: e.amount,
          date: e.expense_date,
          type: "expense"
        }
      })
    })
  }

  const orderRows = rows.filter(({ row }) => Boolean(keyOf(row, ["order_id", "orderid", "order"]) && keyOf(row, ["revenue", "sales", "amount", "total"])))
  const inventoryRows = rowsFor(ready, rows, ["inventory", "stock", "warehouse"]).concat(rows.filter(r => r.datasetId === "pos-system")).filter(({ row }) => Boolean(keyOf(row, ["product_id", "product", "sku", "item"]) && keyOf(row, ["stock_qty", "stock", "quantity_in_stock", "inventory", "quantity"])))
  const supplierRows = rowsFor(ready, rows, ["supplier", "vendor"]).filter(({ row }) => Boolean(keyOf(row, ["supplier_id", "supplier", "supplier_name", "vendor"])))
  const customerRows = rowsFor(ready, rows, ["customer", "client"]).concat(rows.filter(r => r.datasetId === "pos-system"))

  const order = orderRows[0]?.row
  const revenueKey = order ? keyOf(order, ["revenue", "sales", "amount", "total"]) : null
  const quantityKey = order ? keyOf(order, ["quantity", "qty", "units"]) : null
  const dateKey = order ? keyOf(order, ["order_date", "transaction_date", "date", "created_at"]) : null
  const productKey = order ? keyOf(order, ["product_id", "product", "sku", "item"]) : null
  const customerKey = order ? keyOf(order, ["customer_id", "customer", "customer_name"]) : null
  const statusKey = order ? keyOf(order, ["order_status", "status"]) : null

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
    const thresholdKey = keyOf(row, ["low_stock_threshold", "reorder_level", "min_stock"])
    if (!stockKey) return false
    const stock = num(row[stockKey])
    const threshold = thresholdKey ? num(row[thresholdKey]) : 10 // fallback for CSV data
    return stock <= threshold && stock >= 0
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

  const industryConfig = getIndustryConfig(business.industry)
  const t = industryConfig.terminology
  const templates = industryConfig.alertTemplates

  const getTemplate = (id: string, defaultTitle: string, defaultWhy: string, defaultAction: string) => {
    const template = templates.find((t) => t.id === id)
    return {
      title: template?.titleTemplate || defaultTitle,
      why: template?.whyTemplate || defaultWhy,
      action: template?.actionTemplate || defaultAction,
    }
  }

  const signals: BusinessSnapshot["signals"] = []

  if (lowStockRows.length > 0) {
    const inv = getTemplate(
      "inventory-pressure",
      "Inventory pressure is building.",
      "{{count}} inventory records are at or below the low-stock threshold.",
      "Review replenishment for the affected products."
    )
    signals.push({
      id: "inventory-pressure",
      priority: outOfStockRows.length > 0 ? "high" : "medium",
      title: outOfStockRows.length > 0 ? "Stock-outs need attention." : inv.title,
      why: inv.why.replace("{{count}}", lowStockRows.length.toString()),
      action: inv.action,
      evidence: `${outOfStockRows.length} out of stock · ${lowStockRows.length} low stock`,
    })
  }

  if (riskySuppliers > 0) {
    signals.push({
      id: "supplier-risk",
      priority: "medium",
      title: `${t.supplier.singular} lead-time risk is visible.`,
      why: `${riskySuppliers} ${t.supplier.singular.toLowerCase()} record${riskySuppliers === 1 ? "" : "s"} show a lead time of 10 days or more.`,
      action: `Review upcoming purchase orders and ${t.supplier.singular.toLowerCase()} alternatives.`,
      evidence: `${riskySuppliers} high-lead-time ${t.supplier.plural.toLowerCase()}`,
    })
  }

  if (revenueChange !== null && revenueChange <= -10) {
    const rev = getTemplate(
      "revenue-decline",
      "Revenue has declined materially.",
      "The latest 30-day revenue is {{pct}}% below the previous 30-day period.",
      "Investigate product, channel, and customer drivers before the next planning cycle."
    )
    signals.push({
      id: "revenue-decline",
      priority: "high",
      title: rev.title,
      why: rev.why.replace("{{pct}}", Math.abs(revenueChange).toFixed(1)),
      action: rev.action,
      evidence: `${Math.abs(revenueChange).toFixed(1)}% decrease`,
    })
  } else if (revenueChange !== null && revenueChange >= 10) {
    signals.push({
      id: "revenue-growth",
      priority: "low",
      title: "Revenue momentum is positive.",
      why: `The latest 30-day revenue is ${revenueChange.toFixed(1)}% above the previous 30-day period.`,
      action: `Check whether ${t.inventory.singular.toLowerCase()} and ${t.supplier.singular.toLowerCase()} capacity can support the momentum.`,
      evidence: `${revenueChange.toFixed(1)}% increase`,
    })
  }

  if (returns > 0) {
    signals.push({
      id: "returns",
      priority: returns / Math.max(orderRows.length, 1) >= 0.1 ? "high" : "medium",
      title: `Returns are affecting ${t.order.singular.toLowerCase()} activity.`,
      why: `${returns} connected ${t.order.singular.toLowerCase()} row${returns === 1 ? "" : "s"} are marked returned, cancelled, or refunded.`,
      action: `Review the affected ${t.product.plural.toLowerCase()} and return reasons before scaling demand.`,
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
      evidence: `${orders} active ${t.order.plural.toLowerCase()} across ${ready.length} dataset${ready.length === 1 ? "" : "s"}`,
    })
  }

  return {
    businessName: business.name,
    currencyCode: business.currency_code || "INR",
    industryConfig,
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
