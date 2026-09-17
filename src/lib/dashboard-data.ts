/**
 * dashboard-data.ts
 *
 * Authoritative server-side aggregation for the Nexora Dashboard.
 *
 * This module is the single source of truth for Dashboard operational metrics.
 * All metrics are derived directly from the operational tables established in Phases 1–9.
 *
 * ── PHASE 6 RETURN SEMANTICS ────────────────────────────────────────────────
 *
 * When process_pos_return() runs:
 *   1. A NEW mirror order is created:   status='returned', total_amount = -original.total_amount
 *   2. A NEW payment record is created: amount = -original.total_amount (refund)
 *   3. The ORIGINAL order is MUTATED:   status changed from 'confirmed' → 'returned'
 *
 * Consequence for financial aggregation:
 *   - The original order (now status='returned') has a POSITIVE total_amount
 *   - The mirror order  (status='returned')  has a NEGATIVE total_amount
 *   - We cannot simply filter saleOrders = status IN ('confirmed','completed') because
 *     that silently drops BOTH the original order AND its mirror from grossSales,
 *     making a returned sale vanish entirely rather than being properly netted.
 *
 * CORRECT APPROACH:
 *   grossSales  = sum of all orders WHERE total_amount > 0 (original sales, returned or not)
 *   returns     = sum of abs(total_amount) for all mirror return orders (total_amount < 0)
 *   netSales    = grossSales − returns
 *
 * This matches the semantics the pos-integration bridge uses: it passes all orders
 * with their status fields and the dashboard JS filter excludes 'returned' from the
 * completedRows accumulator, but the bridge still passes the amount from the original
 * confirmed row before it was mutated. In the authoritative query, we must replicate
 * this by including returned-but-positive-amount orders in grossSales.
 *
 * ── PAYMENT METRIC SEMANTICS ────────────────────────────────────────────────
 *
 * payments table:
 *   positive amount = cash collected at POS checkout
 *   negative amount = refund issued on process_pos_return
 *
 * We expose:
 *   grossPaymentsCollected = sum of positive payment amounts
 *   refundsIssued          = sum of abs(negative payment amounts)
 *   netPaymentsCollected   = grossPaymentsCollected − refundsIssued
 *
 * Finance page does NOT query payments — it works from order revenue fields.
 * So Dashboard payment metrics have no Finance counterpart for parity checks.
 *
 * ── DATE RANGE SEMANTICS ────────────────────────────────────────────────────
 *
 * Both Finance and Dashboard use the server's local date (new Date()) to determine
 * "today". The Finance page computes latestDate from the most recent dated row,
 * not from wall-clock time. Dashboard uses wall-clock time for the 30-day window.
 *
 * order_date and expense_date are DATE columns (no timezone). Comparisons are
 * string-range comparisons (YYYY-MM-DD). The server always runs in UTC; dates
 * stored are application dates entered by the user or set by CURRENT_DATE in
 * the RPC (which uses the Postgres session timezone, typically UTC for hosted DBs).
 *
 * We use UTC midnight string slicing consistently. A large timezone refactor is
 * out of scope for Phase 10. This matches existing Finance page behavior.
 */

"use server"

import { createClient } from "@/lib/supabase/server"

export type DashboardSummary = {
  // ── Sales ──────────────────────────────────────────────────────
  // grossSales:  all positive-total_amount orders (original sales, including those
  //              subsequently returned — their amount is still a real historical sale)
  grossSales: number
  // returns: total refund value from mirror return orders (total_amount < 0)
  returns: number
  // netSales = grossSales − returns
  netSales: number
  // orderCount: count of distinct sale events (positive-total_amount orders, excluding draft/cancelled)
  orderCount: number
  // returnCount: count of return transactions processed
  returnCount: number
  // averageOrderValue = netSales / orderCount (0 when no orders)
  averageOrderValue: number

  // ── Payments ───────────────────────────────────────────────────
  // Gross payments received (positive payment records only)
  grossPaymentsCollected: number
  // Refunds issued (absolute value of negative payment records)
  refundsIssued: number
  // Net payments = grossPaymentsCollected − refundsIssued
  netPaymentsCollected: number

  // ── Expenses ───────────────────────────────────────────────────
  expenses: number

  // ── Inventory / Products ───────────────────────────────────────
  productCount: number
  lowStockCount: number
  outOfStockCount: number
  partialPurchases: number

  // ── Customers ──────────────────────────────────────────────────
  customerCount: number

  // ── Purchases ──────────────────────────────────────────────────
  pendingPurchases: number   // draft + ordered
  partiallyReceived: number  // partial (in-transit)
  receivedPurchases: number  // received only

  // ── Trend ──────────────────────────────────────────────────────
  // 30-day daily revenue from positive-total_amount orders only
  // windowStart..windowEnd inclusive, windowEnd = today (UTC date)
  windowStart: string
  windowEnd: string
  trend: Array<{ date: string; label: string; revenue: number }>

  // ── Top products ───────────────────────────────────────────────
  topProducts: Array<{ name: string; value: number }>

  // ── Recent orders ──────────────────────────────────────────────
  recentOrders: Array<{
    orderNumber: string
    customer: string
    amount: number
    date: string
    status: string
  }>
}

function formatDateLabel(date: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${date}T00:00:00`))
}

/**
 * Add `days` calendar days to a YYYY-MM-DD date string.
 * Uses UTC strictly to avoid timezone shifts.
 */
function addDays(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00Z`)
  result.setUTCDate(result.getUTCDate() + days)
  return result.toISOString().slice(0, 10)
}

/**
 * Return today's UTC calendar date as YYYY-MM-DD.
 * This matches how CURRENT_DATE behaves in a UTC Postgres instance
 * and how order_date values are stored when set by the RPC.
 */
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * getDashboardSummary
 *
 * Fetch an authoritative dashboard summary for the given workspace.
 * Must be called from a Server Component or Server Action.
 *
 * @param businessId  - The workspace's business UUID (from server-side session, never client-supplied)
 */
export async function getDashboardSummary(businessId: string): Promise<DashboardSummary> {
  const supabase = await createClient()

  const windowEnd = todayUTC()
  const windowStart = addDays(windowEnd, -29)   // inclusive 30-day window

  // ──────────────────────────────────────────────────────────────────────────
  // 1. ORDERS
  //
  // Fetch ALL non-draft, non-cancelled orders for this business.
  // Do NOT pre-filter by status='confirmed'/'completed' because the original
  // order of a returned sale has status='returned' after Phase 6 mutates it.
  //
  // We split by total_amount sign:
  //   total_amount > 0  → original sale (gross sales contributor)
  //   total_amount < 0  → return mirror  (returns contributor)
  //   total_amount = 0  → excluded (edge case: zero-value orders)
  // ──────────────────────────────────────────────────────────────────────────
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      status,
      order_date,
      total_amount,
      customer:customers(name)
    `)
    .eq("business_id", businessId)
    .not("status", "in", '("draft","cancelled")')
    .order("order_date", { ascending: false })

  if (ordersError) {
    throw new Error(`Dashboard orders query failed: ${ordersError.message}`)
  }

  const safeOrders = orders ?? []

  // Positive total_amount = original sale (confirmed, completed, OR the original of a returned order)
  const saleOrders = safeOrders.filter((o) => Number(o.total_amount) > 0)
  // Negative total_amount = return mirror order created by process_pos_return
  const returnOrders = safeOrders.filter((o) => Number(o.total_amount) < 0)

  const grossSales = saleOrders.reduce((sum, o) => sum + Number(o.total_amount), 0)
  const returns = returnOrders.reduce((sum, o) => sum + Math.abs(Number(o.total_amount)), 0)
  const netSales = grossSales - returns
  const orderCount = saleOrders.length
  const returnCount = returnOrders.length
  const averageOrderValue = orderCount > 0 ? netSales / orderCount : 0

  // ──────────────────────────────────────────────────────────────────────────
  // 2. PAYMENTS
  //
  // payments.amount > 0: cash collected at checkout
  // payments.amount < 0: refund issued by process_pos_return
  //
  // Expose both gross and net so the UI can use an accurate label.
  // ──────────────────────────────────────────────────────────────────────────
  const { data: paymentsData, error: paymentsError } = await supabase
    .from("payments")
    .select("amount")
    .eq("business_id", businessId)

  if (paymentsError) {
    throw new Error(`Dashboard payments query failed: ${paymentsError.message}`)
  }

  const allPayments = paymentsData ?? []
  const grossPaymentsCollected = allPayments
    .filter((p) => Number(p.amount) > 0)
    .reduce((sum, p) => sum + Number(p.amount), 0)
  const refundsIssued = allPayments
    .filter((p) => Number(p.amount) < 0)
    .reduce((sum, p) => sum + Math.abs(Number(p.amount)), 0)
  const netPaymentsCollected = grossPaymentsCollected - refundsIssued

  // ──────────────────────────────────────────────────────────────────────────
  // 3. EXPENSES
  // ──────────────────────────────────────────────────────────────────────────
  const { data: expensesData, error: expensesError } = await supabase
    .from("expenses")
    .select("amount")
    .eq("business_id", businessId)

  if (expensesError) {
    throw new Error(`Dashboard expenses query failed: ${expensesError.message}`)
  }

  const expenses = (expensesData ?? []).reduce((sum, e) => sum + Number(e.amount), 0)

  // ──────────────────────────────────────────────────────────────────────────
  // 4. PRODUCTS / INVENTORY (active products only)
  // ──────────────────────────────────────────────────────────────────────────
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("stock_quantity, low_stock_threshold")
    .eq("business_id", businessId)
    .eq("active", true)

  if (productsError) {
    throw new Error(`Dashboard products query failed: ${productsError.message}`)
  }

  const safeProducts = products ?? []
  const productCount = safeProducts.length
  const lowStockCount = safeProducts.filter((p) => {
    const stock = Number(p.stock_quantity) || 0
    const threshold = Number(p.low_stock_threshold) || 10
    return stock > 0 && stock <= threshold
  }).length
  const outOfStockCount = safeProducts.filter(
    (p) => (Number(p.stock_quantity) || 0) <= 0
  ).length

  // ──────────────────────────────────────────────────────────────────────────
  // 5. CUSTOMERS (active only, using count-only head query)
  // ──────────────────────────────────────────────────────────────────────────
  const { count: customerCount, error: customersError } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("is_active", true)

  if (customersError) {
    throw new Error(`Dashboard customers query failed: ${customersError.message}`)
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6. PURCHASES: split by all meaningful statuses
  //    draft    = not yet sent to supplier
  //    ordered  = sent, awaiting delivery
  //    partial  = partially received (in-transit)
  //    received = fully received
  //    cancelled = excluded at DB level
  // ──────────────────────────────────────────────────────────────────────────
  const { data: purchasesData, error: purchasesError } = await supabase
    .from("purchases")
    .select("status")
    .eq("business_id", businessId)
    .not("status", "eq", "cancelled")

  if (purchasesError) {
    throw new Error(`Dashboard purchases query failed: ${purchasesError.message}`)
  }

  const safePurchases = purchasesData ?? []
  const pendingPurchases = safePurchases.filter(
    (p) => p.status === "draft" || p.status === "ordered"
  ).length
  const partiallyReceived = safePurchases.filter((p) => p.status === "partial").length
  const receivedPurchases = safePurchases.filter((p) => p.status === "received").length

  // ──────────────────────────────────────────────────────────────────────────
  // 7. TREND: 30-day daily revenue
  //    Uses positive total_amount orders only (original sales, including those
  //    later returned, because the sale DID happen on that date)
  //    Note: this means the trend shows gross sales per day, matching the
  //    grossSales metric. A separate returns chart would show daily returns.
  // ──────────────────────────────────────────────────────────────────────────
  const { data: trendOrders, error: trendError } = await supabase
    .from("orders")
    .select("order_date, total_amount")
    .eq("business_id", businessId)
    .not("status", "in", '("draft","cancelled")')
    .gt("total_amount", 0)   // Only original sales (positive amounts)
    .gte("order_date", windowStart)
    .lte("order_date", windowEnd)

  if (trendError) {
    throw new Error(`Dashboard trend query failed: ${trendError.message}`)
  }

  const dailyRevenue = new Map<string, number>()
  for (const o of trendOrders ?? []) {
    const date = o.order_date as string
    dailyRevenue.set(date, (dailyRevenue.get(date) ?? 0) + Number(o.total_amount))
  }

  const trend = Array.from({ length: 30 }, (_, i) => {
    const date = addDays(windowStart, i)
    return {
      date,
      label: formatDateLabel(date),
      revenue: dailyRevenue.get(date) ?? 0,
    }
  })

  // ──────────────────────────────────────────────────────────────────────────
  // 8. TOP PRODUCTS by revenue from original-sale order items
  //    Filter: item.total_amount > 0 (original sale items, not return mirror items)
  // ──────────────────────────────────────────────────────────────────────────
  const { data: orderItems, error: itemsError } = await supabase
    .from("order_items")
    .select(`
      product_name_snapshot,
      total_amount,
      order:orders!inner(business_id, status, total_amount)
    `)
    .eq("order.business_id", businessId)
    .not("order.status", "in", '("draft","cancelled")')
    .gt("total_amount", 0)   // Only original sale line items (positive amounts)

  if (itemsError) {
    throw new Error(`Dashboard order items query failed: ${itemsError.message}`)
  }

  const productTotals = new Map<string, number>()
  for (const item of orderItems ?? []) {
    const name = (item.product_name_snapshot as string) || "Unknown Product"
    productTotals.set(name, (productTotals.get(name) ?? 0) + Number(item.total_amount))
  }

  const topProducts = [...productTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }))

  // ──────────────────────────────────────────────────────────────────────────
  // 9. RECENT ORDERS: last 6 original sales (positive total_amount)
  // ──────────────────────────────────────────────────────────────────────────
  const recentOrders = saleOrders.slice(0, 6).map((o) => ({
    orderNumber: o.order_number as string,
    customer: (o.customer as { name?: string } | null)?.name ?? "Walk-in",
    amount: Number(o.total_amount),
    date: o.order_date as string,
    status: o.status as string,
  }))

  return {
    grossSales,
    returns,
    netSales,
    orderCount,
    returnCount,
    averageOrderValue,
    grossPaymentsCollected,
    refundsIssued,
    netPaymentsCollected,
    expenses,
    productCount,
    lowStockCount,
    outOfStockCount,
    partialPurchases: partiallyReceived,
    customerCount: customerCount ?? 0,
    pendingPurchases,
    partiallyReceived,
    receivedPurchases,
    windowStart,
    windowEnd,
    trend,
    topProducts,
    recentOrders,
  }
}
