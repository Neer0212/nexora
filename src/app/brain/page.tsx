import { redirect } from "next/navigation"
import type { Metadata } from "next"

import BusinessBrain from "@/components/brain/BusinessBrain"
import { createClient } from "@/lib/supabase/server"

type JsonRow = Record<string, unknown>
type StoredRow = { datasetId: string; rowNumber: number; row: JsonRow }
type Dataset = {
  id: string
  name: string
  file_name: string | null
  row_count: number | null
  status: string
  created_at: string
}

function numberValue(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[₹$€£,\s]/g, ""))
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function textValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim()
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[\s_-]+/g, "")
}

function findKey(row: JsonRow, aliases: string[]) {
  const normalized = new Map(Object.keys(row).map((key) => [normalize(key), key]))
  for (const alias of aliases) {
    const key = normalized.get(normalize(alias))
    if (key) return key
  }
  return null
}

function keyFrom(rows: StoredRow[], aliases: string[]) {
  const sample = rows[0]?.row
  return sample ? findKey(sample, aliases) : null
}

function datasetLabel(dataset: Dataset) {
  return `${dataset.name} ${dataset.file_name ?? ""}`.toLowerCase()
}

function rowsFor(rows: StoredRow[], datasets: Dataset[], terms: string[]) {
  const datasetMap = new Map(datasets.map((dataset) => [dataset.id, dataset]))

  return rows.filter(({ datasetId, row }) => {
    const dataset = datasetMap.get(datasetId)
    const name = dataset ? datasetLabel(dataset) : ""
    const keys = Object.keys(row).join(" ").toLowerCase()
    return terms.some((term) => name.includes(term) || keys.includes(term))
  })
}

function parseDate(value: unknown) {
  const text = textValue(value)
  if (!text) return null

  const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (match) return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`

  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
}

function shiftDate(date: string, days: number) {
  const result = new Date(`${date}T00:00:00`)
  result.setUTCDate(result.getUTCDate() + days)
  return result.toISOString().slice(0, 10)
}

function isCancelled(status: string) {
  return ["cancelled", "canceled", "returned", "refunded"].includes(status.toLowerCase())
}

export const metadata: Metadata = {
  title: "Business Brain",
  description:
    "Understand the signals, risks, opportunities, and business context Nexora identifies from connected business data.",
  alternates: { canonical: "/brain" },
  robots: { index: false, follow: false },
}

export default async function BusinessBrainPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: membership, error: membershipError } = await supabase
    .from("business_users")
    .select("business_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  if (membershipError) throw new Error(membershipError.message)
  if (!membership) redirect("/onboarding")

  const businessId = membership.business_id

  const [{ data: business, error: businessError }, { data: datasets, error: datasetsError }] =
    await Promise.all([
      supabase.from("businesses").select("name, currency_code").eq("id", businessId).single(),
      supabase
        .from("datasets")
        .select("id, name, file_name, row_count, status, created_at")
        .eq("business_id", businessId)
        .eq("status", "ready")
        .order("created_at", { ascending: false })
        .limit(30),
    ])

  if (businessError || !business) {
    throw new Error(businessError?.message || "Business could not be loaded.")
  }
  if (datasetsError) throw new Error(datasetsError.message)

  const readyDatasets = (datasets ?? []) as Dataset[]
  const datasetIds = readyDatasets.map((dataset) => dataset.id)

  const { data: storedRows, error: rowsError } = datasetIds.length
    ? await supabase
        .from("dataset_rows")
        .select("dataset_id, row_number, row_data")
        .eq("business_id", businessId)
        .in("dataset_id", datasetIds)
        .order("row_number", { ascending: true })
    : { data: [], error: null }

  if (rowsError) throw new Error(rowsError.message)

  const rows: StoredRow[] = (storedRows ?? []).map((item) => ({
    datasetId: item.dataset_id as string,
    rowNumber: item.row_number as number,
    row: (item.row_data ?? {}) as JsonRow,
  }))

  const orderRows = rowsFor(rows, readyDatasets, ["order", "sales", "revenue"])
  const inventoryRows = rowsFor(rows, readyDatasets, ["inventory", "stock", "warehouse"])
  const supplierRows = rowsFor(rows, readyDatasets, ["supplier", "vendor"])
  const productRows = rowsFor(rows, readyDatasets, ["product", "catalog", "sku"])
  const customerRows = rowsFor(rows, readyDatasets, ["customer", "account"])

  const orderDateKey = keyFrom(orderRows, [
    "order_date",
    "transaction_date",
    "date",
    "created_at",
  ])
  const revenueKey = keyFrom(orderRows, ["revenue", "amount", "sales", "total", "total_amount"])
  const statusKey = keyFrom(orderRows, ["order_status", "status"])
  const customerKey = keyFrom(orderRows, ["customer_id", "customer", "customer_name", "account_id"])
  const productKey = keyFrom(orderRows, ["product_id", "product", "sku", "item"])
  const quantityKey = keyFrom(orderRows, ["quantity", "qty", "units"])

  const datedOrders = orderRows
    .map((entry) => ({
      ...entry,
      date: orderDateKey ? parseDate(entry.row[orderDateKey]) : null,
    }))
    .filter((entry) => entry.date !== null)

  const latestOrderDate = datedOrders.reduce<string | null>(
    (latest, entry) => (!latest || entry.date! > latest ? entry.date : latest),
    null
  )

  const anchorDate = latestOrderDate ?? new Date().toISOString().slice(0, 10)
  const currentStart = shiftDate(anchorDate, -29)
  const previousStart = shiftDate(anchorDate, -59)
  const previousEnd = shiftDate(anchorDate, -30)

  const validOrders = datedOrders.filter((entry) => {
    const status = statusKey ? textValue(entry.row[statusKey]) : ""
    return !isCancelled(status)
  })

  const currentOrders = validOrders.filter(
    (entry) => entry.date! >= currentStart && entry.date! <= anchorDate
  )
  const previousOrders = validOrders.filter(
    (entry) => entry.date! >= previousStart && entry.date! <= previousEnd
  )

  const revenueFor = (items: typeof validOrders) =>
    items.reduce((sum, item) => sum + (revenueKey ? numberValue(item.row[revenueKey]) : 0), 0)

  const currentRevenue = revenueFor(currentOrders)
  const previousRevenue = revenueFor(previousOrders)
  const revenueChange =
    previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : null

  const inventoryProductKey = keyFrom(inventoryRows, ["product_id", "product", "sku", "item"])
  const inventoryQtyKey = keyFrom(inventoryRows, [
    "quantity",
    "stock_qty",
    "stock",
    "available_qty",
    "on_hand",
  ])
  const reorderKey = keyFrom(inventoryRows, [
    "reorder_level",
    "reorder_point",
    "minimum_stock",
    "min_stock",
  ])
  const inventoryCostKey = keyFrom(inventoryRows, [
    "unit_cost",
    "cost_per_unit",
    "cost",
    "price",
  ])

  const productNameKey = keyFrom(productRows, ["name", "product_name", "product", "sku"])
  const productIdKey = keyFrom(productRows, ["id", "product_id", "sku", "product"])
  const productMap = new Map<string, { name: string; category: string | null }>()

  for (const entry of productRows) {
    const id = productIdKey ? textValue(entry.row[productIdKey]) : ""
    if (!id) continue

    const name = productNameKey ? textValue(entry.row[productNameKey]) : id
    const categoryKey = findKey(entry.row, ["category", "product_category"])

    productMap.set(id, {
      name: name || id,
      category: categoryKey ? textValue(entry.row[categoryKey]) || null : null,
    })
  }

  const lowStock = inventoryRows
    .filter((entry) => {
      if (!inventoryQtyKey || !reorderKey) return false
      return numberValue(entry.row[inventoryQtyKey]) <= numberValue(entry.row[reorderKey])
    })
    .map((entry) => {
      const productId = inventoryProductKey ? textValue(entry.row[inventoryProductKey]) : ""
      const productName = productMap.get(productId)?.name ?? productId ?? "Unknown product"

      return {
        productId,
        productName: productName || "Unknown product",
        quantity: inventoryQtyKey ? numberValue(entry.row[inventoryQtyKey]) : 0,
        reorderLevel: reorderKey ? numberValue(entry.row[reorderKey]) : 0,
      }
    })

  const inventoryValue = inventoryRows.reduce((sum, entry) => {
    if (!inventoryQtyKey || !inventoryCostKey) return sum
    return sum + numberValue(entry.row[inventoryQtyKey]) * numberValue(entry.row[inventoryCostKey])
  }, 0)

  const productSales = new Map<string, { revenue: number; quantity: number }>()

  for (const entry of currentOrders) {
    const productId = productKey ? textValue(entry.row[productKey]) : ""
    if (!productId) continue

    const existing = productSales.get(productId) ?? { revenue: 0, quantity: 0 }
    existing.revenue += revenueKey ? numberValue(entry.row[revenueKey]) : 0
    existing.quantity += quantityKey ? numberValue(entry.row[quantityKey]) : 0
    productSales.set(productId, existing)
  }

  const topProducts = [...productSales.entries()]
    .map(([id, values]) => ({
      id,
      name: productMap.get(id)?.name ?? id,
      category: productMap.get(id)?.category ?? null,
      revenue: values.revenue,
      quantity: values.quantity,
      lowStock: lowStock.some((item) => item.productId === id),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const supplierStatusKey = keyFrom(supplierRows, ["status", "supplier_status"])
  const supplierReliabilityKey = keyFrom(supplierRows, [
    "reliability",
    "reliability_score",
    "on_time_rate",
  ])
  const supplierLeadKey = keyFrom(supplierRows, [
    "average_lead_time",
    "lead_time",
    "lead_time_days",
    "delivery_days",
  ])
  const supplierNameKey = keyFrom(supplierRows, ["name", "supplier_name", "vendor_name"])

  const supplierRisks = supplierRows
    .map((entry) => {
      const status = supplierStatusKey ? textValue(entry.row[supplierStatusKey]).toLowerCase() : ""
      const reliability = supplierReliabilityKey
        ? numberValue(entry.row[supplierReliabilityKey])
        : null
      const leadTime = supplierLeadKey ? numberValue(entry.row[supplierLeadKey]) : null
      const riskScore =
        (["watch", "at risk", "risk", "delayed", "poor"].some((term) => status.includes(term)) ? 2 : 0) +
        (leadTime !== null && leadTime >= 10 ? 1 : 0) +
        (reliability !== null && reliability < 80 ? 1 : 0)

      return {
        id: entry.rowNumber.toString(),
        name: supplierNameKey
          ? textValue(entry.row[supplierNameKey]) || "Unknown supplier"
          : "Unknown supplier",
        reliability,
        leadTime,
        riskScore,
      }
    })
    .filter((supplier) => supplier.riskScore > 0)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5)

  const customerIdKey = keyFrom(customerRows, [
    "customer_id",
    "id",
    "customer",
    "account_id",
    "account",
  ])
  const customerCount = customerRows.length
    ? new Set(
        customerRows
          .map((entry) => (customerIdKey ? textValue(entry.row[customerIdKey]) : ""))
          .filter(Boolean)
      ).size || customerRows.length
    : new Set(
        orderRows
          .map((entry) => (customerKey ? textValue(entry.row[customerKey]) : ""))
          .filter(Boolean)
      ).size

  const connectedSignals = [
    orderRows.length > 0,
    productRows.length > 0,
    inventoryRows.length > 0,
    supplierRows.length > 0,
    customerRows.length > 0 || customerCount > 0,
  ].filter(Boolean).length

  return (
    <BusinessBrain
      data={{
        businessName: business.name ?? "Your business",
        currencyCode: business.currency_code ?? "INR",
        currentRevenue,
        previousRevenue,
        revenueChange,
        currentOrdersCount: currentOrders.length,
        previousOrdersCount: previousOrders.length,
        averageOrderValue:
          currentOrders.length > 0 ? currentRevenue / currentOrders.length : 0,
        inventoryValue,
        inventoryCount: inventoryRows.length,
        lowStock,
        topProducts,
        supplierRisks,
        suppliersCount: supplierRows.length,
        datasetsCount: readyDatasets.length,
        readyDatasetsCount: readyDatasets.length,
        connectedSignals,
        events: [],
        recommendations: [],
      }}
    />
  )
}
