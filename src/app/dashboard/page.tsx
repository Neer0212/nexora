import { redirect } from "next/navigation"

import DashboardOverview from "@/components/dashboard/DashboardOverview"
import { createClient } from "@/lib/supabase/server"

type OrderRow = {
  order_number: string
  order_date: string
  total_amount: number | string | null
  status: string
  customers: { name: string } | { name: string }[] | null
}

type InventoryRow = {
  quantity: number | string | null
  reorder_level: number | string | null
  unit_cost: number | string | null
}

type EventRow = {
  title: string
  description: string | null
  severity: string | null
  occurred_at: string
}

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function shortDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(date)
}

export default async function DashboardPage() {
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

  const today = new Date()
  const sixtyDaysAgo = new Date(today)
  sixtyDaysAgo.setDate(today.getDate() - 59)

  const [
    businessResult,
    ordersResult,
    inventoryResult,
    suppliersResult,
    customersResult,
    datasetsResult,
    eventsResult,
  ] = await Promise.all([
    supabase
      .from("businesses")
      .select("currency_code")
      .eq("id", businessId)
      .single(),

    supabase
      .from("orders")
      .select(
        "order_number, order_date, total_amount, status, customers(name)"
      )
      .eq("business_id", businessId)
      .gte("order_date", dateKey(sixtyDaysAgo))
      .order("order_date", { ascending: false }),

    supabase
      .from("inventory")
      .select("quantity, reorder_level, unit_cost")
      .eq("business_id", businessId),

    supabase
      .from("suppliers")
      .select("id")
      .eq("business_id", businessId),

    supabase
      .from("customers")
      .select("id")
      .eq("business_id", businessId),

    supabase
      .from("datasets")
      .select("id, status")
      .eq("business_id", businessId),

    supabase
      .from("business_events")
      .select("title, description, severity, occurred_at")
      .eq("business_id", businessId)
      .order("occurred_at", { ascending: false })
      .limit(5),
  ])

  const firstError = [
    businessResult.error,
    ordersResult.error,
    inventoryResult.error,
    suppliersResult.error,
    customersResult.error,
    datasetsResult.error,
    eventsResult.error,
  ].find(Boolean)

  if (firstError) {
    throw new Error(firstError.message)
  }

  const currencyCode = businessResult.data?.currency_code || "INR"
  const orders = (ordersResult.data ?? []) as OrderRow[]
  const inventory = (inventoryResult.data ?? []) as InventoryRow[]
  const events = (eventsResult.data ?? []) as EventRow[]

  const validOrders = orders.filter(
    (order) => order.status.toLowerCase() !== "cancelled"
  )

  const revenue = validOrders.reduce(
    (sum, order) => sum + numberValue(order.total_amount),
    0
  )

  const inventoryValue = inventory.reduce(
    (sum, item) =>
      sum + numberValue(item.quantity) * numberValue(item.unit_cost),
    0
  )

  const lowStockCount = inventory.filter((item) => {
    const reorderLevel = item.reorder_level

    return (
      reorderLevel !== null &&
      reorderLevel !== undefined &&
      numberValue(item.quantity) <= numberValue(reorderLevel)
    )
  }).length

  const trend = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today)
    date.setHours(0, 0, 0, 0)
    date.setDate(today.getDate() - (29 - index))

    const key = dateKey(date)

    const value = validOrders
      .filter((order) => order.order_date === key)
      .reduce((sum, order) => sum + numberValue(order.total_amount), 0)

    return {
      label: shortDate(date),
      value,
    }
  })

  const recentOrders = validOrders.slice(0, 6).map((order) => {
    const customer = Array.isArray(order.customers)
      ? order.customers[0]?.name
      : order.customers?.name

    return {
      orderNumber: order.order_number,
      customer: customer || "Unassigned customer",
      amount: numberValue(order.total_amount),
      status: order.status,
      date: order.order_date,
    }
  })

  const datasets = datasetsResult.data ?? []
  const readyDatasetCount = datasets.filter(
    (dataset) => dataset.status === "ready"
  ).length

  return (
    <DashboardOverview
      data={{
        currencyCode,
        hasData:
          validOrders.length > 0 ||
          inventory.length > 0 ||
          (suppliersResult.data?.length ?? 0) > 0 ||
          (customersResult.data?.length ?? 0) > 0 ||
          datasets.length > 0 ||
          events.length > 0,
        revenue,
        ordersCount: validOrders.length,
        inventoryValue,
        inventoryCount: inventory.length,
        lowStockCount,
        suppliersCount: suppliersResult.data?.length ?? 0,
        customersCount: customersResult.data?.length ?? 0,
        datasetCount: datasets.length,
        readyDatasetCount,
        trend,
        recentOrders,
        events: events.map((event) => ({
          title: event.title,
          description: event.description,
          severity: event.severity,
          occurredAt: event.occurred_at,
        })),
      }}
    />
  )
}