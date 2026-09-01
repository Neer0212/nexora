import { createClient } from "@/lib/supabase/server"

type Row = Record<string, unknown>
type StoredRow = { dataset_id: string; row_number: number; row_data: unknown }
type Dataset = { id: string; name: string; file_name: string | null; row_count: number | null; status: string; created_at: string }

export type CustomerInsight = {
  id: string
  name: string
  orders: number
  revenue: number
  units: number
  averageOrderValue: number
  share: number
}

export type ProductInsight = {
  id: string
  name: string
  orders: number
  revenue: number
  units: number
  share: number
}

export type EntityInsights = {
  businessName: string
  currencyCode: string
  latestDate: string | null
  customers: CustomerInsight[]
  products: ProductInsight[]
  dailyRevenue: Array<{ date: string; revenue: number }>
}

const text = (value: unknown) => value == null ? "" : String(value).trim()
const num = (value: unknown) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  const parsed = Number(text(value).replace(/[₹$€£,%\s]/g, ""))
  return Number.isFinite(parsed) ? parsed : 0
}
const norm = (value: string) => value.toLowerCase().replace(/[\s_-]+/g, "")

function keyOf(row: Row, aliases: string[]) {
  const map = new Map(Object.keys(row).map((key) => [norm(key), key]))
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
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
}

function datasetLabel(dataset: Dataset) {
  return `${dataset.name} ${dataset.file_name ?? ""}`.toLowerCase()
}

export async function getEntityInsights(): Promise<EntityInsights> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("AUTH_REQUIRED")

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
  
  const { data: rawRows, error: rowsError } = await supabase
    .from("dataset_rows")
    .select("dataset_id, row_data")
    .in("dataset_id", ready.map(d => d.id))
    
  if (rowsError) throw new Error(rowsError.message)

  const rows = (rawRows || []).map((item: any) => ({ datasetId: item.dataset_id, row: (item.row_data ?? {}) as Row }))

  // Phase 6: Integrate POS operational data natively into the Intelligence layer
  const { data: posOrders } = await supabase
    .from("orders")
    .select(`
      id, order_number, order_date, total_amount, status,
      customer:customers(name),
      items:order_items(quantity, product_name_snapshot)
    `)
    .eq("business_id", membership.business_id)

  if (posOrders) {
    posOrders.forEach(o => {
      const units = o.items.reduce((sum: number, i: any) => sum + Number(i.quantity), 0)
      const topProductName = o.items.length > 0 ? o.items[0].product_name_snapshot : "Unknown Product"
      rows.push({
        datasetId: "pos-system",
        row: {
          order_id: o.order_number,
          revenue: o.total_amount,
          date: o.order_date,
          status: o.status,
          units: units,
          customer_name: (o.customer as any)?.name || "Walk-in",
          product: topProductName
        }
      })
    })
  }

  const orderRows = rows.filter(({ row }) => Boolean(keyOf(row, ["order_id", "orderid", "order"]) && keyOf(row, ["revenue", "sales", "amount", "total"])))
  const first = orderRows[0]?.row
  const revenueKey = first ? keyOf(first, ["revenue", "sales", "amount", "total"]) : null
  const quantityKey = first ? keyOf(first, ["quantity", "qty", "units"]) : null
  const dateKey = first ? keyOf(first, ["order_date", "transaction_date", "date", "created_at"]) : null
  const customerKey = first ? keyOf(first, ["customer_id", "customer", "customer_name", "client"]) : null
  const productKey = first ? keyOf(first, ["product_id", "product", "sku", "item"]) : null
  const statusKey = first ? keyOf(first, ["order_status", "status"]) : null
  const excluded = new Set(["cancelled", "canceled", "returned", "refunded"])
  const active = orderRows.filter(({ row }) => !excluded.has(statusKey ? text(row[statusKey]).toLowerCase() : ""))

  const customerMap = new Map<string, { orders: number; revenue: number; units: number }>()
  const productMap = new Map<string, { orders: number; revenue: number; units: number }>()
  const dailyMap = new Map<string, number>()
  for (const { row } of active) {
    const revenue = revenueKey ? num(row[revenueKey]) : 0
    const units = quantityKey ? num(row[quantityKey]) : 0
    if (customerKey) {
      const id = text(row[customerKey])
      if (id) {
        const current = customerMap.get(id) ?? { orders: 0, revenue: 0, units: 0 }
        current.orders += 1; current.revenue += revenue; current.units += units
        customerMap.set(id, current)
      }
    }
    if (productKey) {
      const id = text(row[productKey])
      if (id) {
        const current = productMap.get(id) ?? { orders: 0, revenue: 0, units: 0 }
        current.orders += 1; current.revenue += revenue; current.units += units
        productMap.set(id, current)
      }
    }
    const date = dateKey ? parseDate(row[dateKey]) : null
    if (date) dailyMap.set(date, (dailyMap.get(date) ?? 0) + revenue)
  }

  const totalRevenue = active.reduce((sum, { row }) => sum + (revenueKey ? num(row[revenueKey]) : 0), 0)
  const makeList = (map: Map<string, { orders: number; revenue: number; units: number }>, kind: "customer" | "product") => [...map.entries()]
    .map(([id, value]) => ({ id, name: id, ...value, averageOrderValue: value.orders ? value.revenue / value.orders : 0, share: totalRevenue ? (value.revenue / totalRevenue) * 100 : 0 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 25)

  const customers = makeList(customerMap, "customer").map(({ id, name, orders, revenue, units, averageOrderValue, share }) => ({ id, name, orders, revenue, units, averageOrderValue, share }))
  const products = makeList(productMap, "product").map(({ id, name, orders, revenue, units, share }) => ({ id, name, orders, revenue, units, share }))
  const dailyRevenue = [...dailyMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, revenue]) => ({ date, revenue }))

  return { businessName: business.name, currencyCode: business.currency_code || "INR", latestDate: dailyRevenue.at(-1)?.date ?? null, customers, products, dailyRevenue }
}
