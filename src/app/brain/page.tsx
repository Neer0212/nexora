import { redirect } from "next/navigation"

import BusinessBrain from "@/components/brain/BusinessBrain"
import { createClient } from "@/lib/supabase/server"

type OrderRow = {
  id: string
  order_date: string
  total_amount: number | string | null
  status: string
}

type OrderItemRow = {
  order_id: string
  product_id: string | null
  quantity: number | string | null
  total_amount: number | string | null
}

type ProductRow = {
  id: string
  name: string
  category: string | null
}

type InventoryRow = {
  product_id: string
  quantity: number | string | null
  reorder_level: number | string | null
  unit_cost: number | string | null
}

type SupplierRow = {
  id: string
  name: string
  reliability: number | string | null
  average_lead_time: number | string | null
  status: string
}

type DatasetRow = {
  id: string
  name: string
  status: string
  updated_at: string
}

type EventRow = {
  id: string
  title: string
  description: string | null
  severity: string | null
  occurred_at: string
}

type RecommendationRow = {
  id: string
  title: string
  reason: string | null
  evidence: unknown
  impact: unknown
  confidence: number | string | null
  status: string
  created_at: string
}

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function daysAgo(days: number) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - days)
  return date
}

function isCancelled(status: string) {
  return status.toLowerCase() === "cancelled"
}

export default async function BusinessBrainPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: membership, error: membershipError } = await supabase
    .from("business_users")
    .select("business_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  if (membershipError) {
    throw new Error(membershipError.message)
  }

  if (!membership) {
    redirect("/onboarding")
  }

  const businessId = membership.business_id
  const currentStart = dateKey(daysAgo(29))
  const previousStart = dateKey(daysAgo(59))
  const previousEnd = dateKey(daysAgo(30))

  const [
    businessResult,
    ordersResult,
    inventoryResult,
    suppliersResult,
    productsResult,
    datasetsResult,
    eventsResult,
    recommendationsResult,
  ] = await Promise.all([
    supabase
      .from("businesses")
      .select("name, currency_code")
      .eq("id", businessId)
      .single(),

    supabase
      .from("orders")
      .select("id, order_date, total_amount, status")
      .eq("business_id", businessId)
      .gte("order_date", previousStart)
      .lte("order_date", dateKey(new Date()))
      .order("order_date", { ascending: false }),

    supabase
      .from("inventory")
      .select("product_id, quantity, reorder_level, unit_cost")
      .eq("business_id", businessId),

    supabase
      .from("suppliers")
      .select("id, name, reliability, average_lead_time, status")
      .eq("business_id", businessId),

    supabase
      .from("products")
      .select("id, name, category")
      .eq("business_id", businessId),

    supabase
      .from("datasets")
      .select("id, name, status, updated_at")
      .eq("business_id", businessId)
      .order("updated_at", { ascending: false }),

    supabase
      .from("business_events")
      .select("id, title, description, severity, occurred_at")
      .eq("business_id", businessId)
      .order("occurred_at", { ascending: false })
      .limit(8),

    supabase
      .from("recommendations")
      .select(
        "id, title, reason, evidence, impact, confidence, status, created_at"
      )
      .eq("business_id", businessId)
      .eq("status", "new")
      .order("created_at", { ascending: false })
      .limit(6),
  ])

  const firstError = [
    businessResult.error,
    ordersResult.error,
    inventoryResult.error,
    suppliersResult.error,
    productsResult.error,
    datasetsResult.error,
    eventsResult.error,
    recommendationsResult.error,
  ].find(Boolean)

  if (firstError) {
    throw new Error(firstError.message)
  }

  const orders = (ordersResult.data ?? []) as OrderRow[]
  const inventory = (inventoryResult.data ?? []) as InventoryRow[]
  const suppliers = (suppliersResult.data ?? []) as SupplierRow[]
  const products = (productsResult.data ?? []) as ProductRow[]
  const datasets = (datasetsResult.data ?? []) as DatasetRow[]
  const events = (eventsResult.data ?? []) as EventRow[]
  const recommendations = (recommendationsResult.data ?? []) as RecommendationRow[]

  const validOrders = orders.filter((order) => !isCancelled(order.status))
  const currentOrders = validOrders.filter((order) => order.order_date >= currentStart)
  const previousOrders = validOrders.filter(
    (order) => order.order_date >= previousStart && order.order_date <= previousEnd
  )

  const currentRevenue = currentOrders.reduce(
    (sum, order) => sum + numberValue(order.total_amount),
    0
  )

  const previousRevenue = previousOrders.reduce(
    (sum, order) => sum + numberValue(order.total_amount),
    0
  )

  const revenueChange =
    previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : null

  const inventoryValue = inventory.reduce(
    (sum, item) =>
      sum + numberValue(item.quantity) * numberValue(item.unit_cost),
    0
  )

  const lowStock = inventory.filter(
    (item) =>
      item.reorder_level !== null &&
      numberValue(item.quantity) <= numberValue(item.reorder_level)
  )

  const productMap = new Map(products.map((product) => [product.id, product]))

  const orderIds = currentOrders.map((order) => order.id)
  let orderItems: OrderItemRow[] = []

  if (orderIds.length > 0) {
    const { data, error } = await supabase
      .from("order_items")
      .select("order_id, product_id, quantity, total_amount")
      .in("order_id", orderIds)

    if (error) {
      throw new Error(error.message)
    }

    orderItems = (data ?? []) as OrderItemRow[]
  }

  const productSales = new Map<string, { revenue: number; quantity: number }>()

  for (const item of orderItems) {
    if (!item.product_id) continue

    const existing = productSales.get(item.product_id) ?? {
      revenue: 0,
      quantity: 0,
    }

    existing.revenue += numberValue(item.total_amount)
    existing.quantity += numberValue(item.quantity)
    productSales.set(item.product_id, existing)
  }

  const topProducts = Array.from(productSales.entries())
    .map(([productId, values]) => ({
      id: productId,
      name: productMap.get(productId)?.name ?? "Unassigned product",
      category: productMap.get(productId)?.category ?? null,
      revenue: values.revenue,
      quantity: values.quantity,
      lowStock: lowStock.some((item) => item.product_id === productId),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const supplierRisks = suppliers
    .filter((supplier) => supplier.status.toLowerCase() !== "inactive")
    .map((supplier) => {
      const reliability =
        supplier.reliability === null ? null : numberValue(supplier.reliability)
      const leadTime =
        supplier.average_lead_time === null
          ? null
          : numberValue(supplier.average_lead_time)

      const riskScore =
        (leadTime !== null && leadTime >= 14 ? 2 : 0) +
        (reliability !== null && reliability < 80 ? 2 : 0)

      return {
        id: supplier.id,
        name: supplier.name,
        reliability,
        leadTime,
        riskScore,
      }
    })
    .filter((supplier) => supplier.riskScore > 0)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5)

  const readyDatasets = datasets.filter((dataset) => dataset.status === "ready")

  const connectedSignals = [
    currentOrders.length > 0,
    inventory.length > 0,
    suppliers.length > 0,
    products.length > 0,
    datasets.length > 0,
  ].filter(Boolean).length

  return (
    <BusinessBrain
      data={{
        businessName: businessResult.data?.name ?? "Your business",
        currencyCode: businessResult.data?.currency_code ?? "INR",
        currentRevenue,
        previousRevenue,
        revenueChange,
        currentOrdersCount: currentOrders.length,
        previousOrdersCount: previousOrders.length,
        averageOrderValue:
          currentOrders.length > 0 ? currentRevenue / currentOrders.length : 0,
        inventoryValue,
        inventoryCount: inventory.length,
        lowStock: lowStock.map((item) => ({
          productId: item.product_id,
          productName: productMap.get(item.product_id)?.name ?? "Unknown product",
          quantity: numberValue(item.quantity),
          reorderLevel: numberValue(item.reorder_level),
        })),
        topProducts,
        supplierRisks,
        suppliersCount: suppliers.length,
        datasetsCount: datasets.length,
        readyDatasetsCount: readyDatasets.length,
        connectedSignals,
        events: events.map((event) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          severity: event.severity,
          occurredAt: event.occurred_at,
        })),
        recommendations: recommendations.map((recommendation) => ({
          id: recommendation.id,
          title: recommendation.title,
          reason: recommendation.reason,
          evidence: recommendation.evidence,
          impact: recommendation.impact,
          confidence: numberValue(recommendation.confidence),
          createdAt: recommendation.created_at,
        })),
      }}
    />
  )
}