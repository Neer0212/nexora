import { describe, it, expect, vi } from "vitest"

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
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
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
  createClient: vi.fn(() => Promise.resolve({ from: mockFrom })),
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

describe("Finance and Dashboard Parity", () => {
  it("computes Dashboard netSales exactly equal to Finance revenue for a fully returned sale", async () => {
    const orders = [
      { id: "o1", order_number: "ORD-1", status: "completed", total_amount: 1000, order_date: "2026-09-17" },
      { id: "o2", order_number: "ORD-2", status: "returned", total_amount: 500, order_date: "2026-09-17" }, // Returned original
      { id: "o3", order_number: "RET-2", status: "returned", total_amount: -500, order_date: "2026-09-17" }, // Mirror return
    ]
    const orderItems = [
      { order_id: "o1", quantity: 1, unit_price: 1000, total_amount: 1000 },
      { order_id: "o2", quantity: 1, unit_price: 500, total_amount: 500 },
      { order_id: "o3", quantity: -1, unit_price: 500, total_amount: -500 },
    ]
    const expenses = [
      { amount: 250, expense_date: "2026-09-17" }
    ]

    mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "orders") return chainBuilder({ data: orders })
      if (table === "order_items") return chainBuilder({ data: orderItems })
      if (table === "expenses") return chainBuilder({ data: expenses })
      return chainBuilder({ data: [] })
    })

    // 1. Dashboard authoritative calculation
    const { getDashboardSummary } = await import("../src/lib/dashboard-data")
    const dashboard = await getDashboardSummary("biz-1")

    expect(dashboard.grossSales).toBe(1500) // 1000 + 500
    expect(dashboard.returns).toBe(500)     // |-500|
    expect(dashboard.netSales).toBe(1000)   // 1500 - 500
    expect(dashboard.expenses).toBe(250)

    // 2. Finance bridge calculation
    const { appendOperationalData } = await import("../src/lib/pos-integration")
    const bridgeRows = await appendOperationalData("biz-1", [])
    
    // Finance filtering logic (from src/app/finance/page.tsx)
    const validRows = bridgeRows.filter(({ row }) => {
      const status = String(row["status"]).toLowerCase()
      return !["returned", "cancelled", "refunded"].includes(status)
    })

    const financeRevenue = validRows.reduce((sum, { row }) => sum + Number(row["revenue"] || 0), 0)
    
    // Parity assertion: Finance revenue == Dashboard netSales
    expect(financeRevenue).toBe(dashboard.netSales)
    expect(financeRevenue).toBe(1000)

    // Expense logic check
    const expenseRows = validRows.filter(({ row }) => row["expense"] !== undefined)
    const financeExpenses = expenseRows.reduce((sum, { row }) => sum + Number(row["expense"] || 0), 0)
    expect(financeExpenses).toBe(dashboard.expenses)
    expect(financeExpenses).toBe(250)
  })
})
