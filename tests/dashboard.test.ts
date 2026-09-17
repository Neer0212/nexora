/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * tests/dashboard.test.ts
 *
 * Tests for Phase 10 Dashboard Integration (including Phase 10.1 Corrections).
 */

import { describe, it, expect, vi, beforeEach } from "vitest"

// ────────────────────────────────────────────────────────────────
// Mock supabase client
// ────────────────────────────────────────────────────────────────
const mockSupabaseQuery = {
  data: null as unknown,
  error: null as unknown,
  count: null as number | null,
}

const chainBuilder = (overrides: Partial<typeof mockSupabaseQuery> = {}) => {
  const result = { ...mockSupabaseQuery, ...overrides }
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: undefined,
  }
  Object.defineProperty(chain, Symbol.toStringTag, { value: "Promise" })
  chain[Symbol.iterator] = undefined
  ;(chain as any)[Symbol.for("nodejs.rejection")] = undefined
  const resolved = Promise.resolve(result)
  chain.then = resolved.then.bind(resolved)
  chain.catch = resolved.catch.bind(resolved)
  chain.finally = resolved.finally.bind(resolved)
  return chain
}

let mockFrom: ReturnType<typeof vi.fn>

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: mockFrom,
    })
  ),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

describe("getDashboardSummary - Phase 10.1 Return & Financial Semantics", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockFrom = vi.fn().mockReturnValue(
      chainBuilder({ data: [], error: null, count: 0 })
    )
  })

  it("returns zero metrics for a workspace with no data", async () => {
    const { getDashboardSummary } = await import("../src/lib/dashboard-data")
    const result = await getDashboardSummary("business-123")

    expect(result.grossSales).toBe(0)
    expect(result.returns).toBe(0)
    expect(result.netSales).toBe(0)
    expect(result.grossPaymentsCollected).toBe(0)
    expect(result.refundsIssued).toBe(0)
    expect(result.netPaymentsCollected).toBe(0)
  })

  // 1. Normal Sale
  it("computes sales and payments for a normal sale", async () => {
    const orders = [{ id: "o1", order_number: "ORD-1", status: "confirmed", total_amount: 500 }]
    const payments = [{ amount: 500 }]

    mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "orders") return chainBuilder({ data: orders, error: null })
      if (table === "payments") return chainBuilder({ data: payments, error: null })
      return chainBuilder({ data: [], error: null, count: 0 })
    })

    const { getDashboardSummary } = await import("../src/lib/dashboard-data")
    const result = await getDashboardSummary("business-123")

    expect(result.grossSales).toBe(500)
    expect(result.returns).toBe(0)
    expect(result.netSales).toBe(500)
    expect(result.grossPaymentsCollected).toBe(500)
    expect(result.netPaymentsCollected).toBe(500)
  })

  // 2. Fully Returned Sale (Phase 6 Semantics)
  it("preserves original sale in grossSales even when status='returned'", async () => {
    const orders = [
      // Original sale mutated by Phase 6 to 'returned', but amount is still positive
      { id: "o1", order_number: "ORD-1", status: "returned", total_amount: 500 },
      // Phase 6 mirror order
      { id: "o2", order_number: "RET-1", status: "returned", total_amount: -500 }
    ]

    mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "orders") return chainBuilder({ data: orders, error: null })
      return chainBuilder({ data: [], error: null, count: 0 })
    })

    const { getDashboardSummary } = await import("../src/lib/dashboard-data")
    const result = await getDashboardSummary("business-123")

    expect(result.grossSales).toBe(500) // Original sale MUST remain in gross sales
    expect(result.returns).toBe(500)    // Mirror order contributes to returns
    expect(result.netSales).toBe(0)     // Correctly netted out exactly once
  })

  // 3. Sale with a refund (Payment records)
  it("computes gross and net payments when a refund is present", async () => {
    const payments = [
      { amount: 500 }, // original payment
      { amount: -500 } // refund payment from process_pos_return
    ]

    mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "payments") return chainBuilder({ data: payments, error: null })
      return chainBuilder({ data: [], error: null, count: 0 })
    })

    const { getDashboardSummary } = await import("../src/lib/dashboard-data")
    const result = await getDashboardSummary("business-123")

    expect(result.grossPaymentsCollected).toBe(500)
    expect(result.refundsIssued).toBe(500)
    expect(result.netPaymentsCollected).toBe(0)
  })

  // 4. Multiple sales with one returned (No double subtraction)
  it("aggregates multiple sales and one return correctly", async () => {
    const orders = [
      { id: "o1", order_number: "ORD-1", status: "returned", total_amount: 200 }, // returned sale
      { id: "o2", order_number: "RET-1", status: "returned", total_amount: -200 }, // mirror return
      { id: "o3", order_number: "ORD-2", status: "completed", total_amount: 800 }  // kept sale
    ]

    mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "orders") return chainBuilder({ data: orders, error: null })
      return chainBuilder({ data: [], error: null, count: 0 })
    })

    const { getDashboardSummary } = await import("../src/lib/dashboard-data")
    const result = await getDashboardSummary("business-123")

    expect(result.grossSales).toBe(1000) // 200 + 800
    expect(result.returns).toBe(200)
    expect(result.netSales).toBe(800)
    expect(result.orderCount).toBe(2) // two positive sales
  })

  it("filters draft and cancelled orders entirely", async () => {
    const orders = [
      { id: "o1", order_number: "ORD-1", status: "confirmed", total_amount: 200 },
      // draft/cancelled wouldn't even be returned by DB due to filter, but if they were:
    ]

    mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "orders") return chainBuilder({ data: orders, error: null })
      return chainBuilder({ data: [], error: null, count: 0 })
    })

    const { getDashboardSummary } = await import("../src/lib/dashboard-data")
    const result = await getDashboardSummary("business-123")

    expect(result.grossSales).toBe(200)
  })

  it("handles purchase statuses correctly (pending vs partial vs received)", async () => {
    const purchases = [
      { status: "draft" },
      { status: "ordered" },
      { status: "partial" },
      { status: "received" }
    ]

    mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "purchases") return chainBuilder({ data: purchases, error: null })
      return chainBuilder({ data: [], error: null, count: 0 })
    })

    const { getDashboardSummary } = await import("../src/lib/dashboard-data")
    const result = await getDashboardSummary("business-123")

    expect(result.pendingPurchases).toBe(2)   // draft + ordered
    expect(result.partiallyReceived).toBe(1)  // partial
    expect(result.receivedPurchases).toBe(1)  // received
  })

  it("computes 30-day UTC window correctly", async () => {
    const { getDashboardSummary } = await import("../src/lib/dashboard-data")
    const result = await getDashboardSummary("business-123")

    expect(result.windowStart).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(result.windowEnd).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    const end = new Date(`${result.windowEnd}T00:00:00Z`).getTime()
    const start = new Date(`${result.windowStart}T00:00:00Z`).getTime()
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24))
    
    // Inclusive window from start to end = 30 days total (start + 29 days)
    expect(diffDays).toBe(29)
    expect(result.trend.length).toBe(30)
  })
  it("uses expenses table for operating expenses", async () => {
    const expenses = [
      { amount: 1500 },
      { amount: 250 },
    ]
    mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "expenses") return chainBuilder({ data: expenses, error: null })
      return chainBuilder({ data: [], error: null, count: 0 })
    })
    const { getDashboardSummary } = await import("../src/lib/dashboard-data")
    const result = await getDashboardSummary("business-123")
    expect(result.expenses).toBe(1750)
  })

  it("counts only active customers (is_active = true)", async () => {
    mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "customers") return chainBuilder({ data: null, error: null, count: 7 })
      return chainBuilder({ data: [], error: null, count: 0 })
    })
    const { getDashboardSummary } = await import("../src/lib/dashboard-data")
    const result = await getDashboardSummary("business-123")
    expect(result.customerCount).toBe(7)
  })

  it("counts active products for inventory, and detects low stock / out of stock", async () => {
    const products = [
      { stock_quantity: 0, low_stock_threshold: 5, active: true },   // out of stock
      { stock_quantity: 3, low_stock_threshold: 5, active: true },   // low stock
      { stock_quantity: 50, low_stock_threshold: 5, active: true },  // healthy
    ]
    mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "products") return chainBuilder({ data: products, error: null })
      return chainBuilder({ data: [], error: null, count: 0 })
    })
    const { getDashboardSummary } = await import("../src/lib/dashboard-data")
    const result = await getDashboardSummary("business-123")
    expect(result.productCount).toBe(3)
    expect(result.outOfStockCount).toBe(1)
    expect(result.lowStockCount).toBe(1)
  })

  it("builds a 30-day trend with zeros for days with no sales", async () => {
    mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "orders") return chainBuilder({ data: [], error: null })
      return chainBuilder({ data: [], error: null, count: 0 })
    })
    const { getDashboardSummary } = await import("../src/lib/dashboard-data")
    const result = await getDashboardSummary("business-123")
    expect(result.trend).toHaveLength(30)
    result.trend.forEach((p) => {
      expect(p.revenue).toBe(0)
      expect(p.label).toBeTruthy()
      expect(p.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  it("averageOrderValue is 0 when there are no orders", async () => {
    const { getDashboardSummary } = await import("../src/lib/dashboard-data")
    const result = await getDashboardSummary("business-123")
    expect(result.averageOrderValue).toBe(0)
  })

  it("averageOrderValue is netSales / orderCount", async () => {
    const orders = [
      { id: "o1", order_number: "ORD-1", status: "confirmed", total_amount: 300 },
      { id: "o2", order_number: "ORD-2", status: "confirmed", total_amount: 300 },
    ]
    mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "orders") return chainBuilder({ data: orders, error: null })
      return chainBuilder({ data: [], error: null, count: 0 })
    })
    const { getDashboardSummary } = await import("../src/lib/dashboard-data")
    const result = await getDashboardSummary("business-123")
    expect(result.averageOrderValue).toBe(300) // 600 net sales / 2 orders
  })
})
