import { describe, it, expect } from "vitest"
import {
  computeOrderMetrics,
  computePeriodComparison,
  computeInventoryMetrics,
  computeSupplierMetrics,
  computeCustomerMetrics,
  computeProductMetrics,
} from "@/lib/business-metrics"

describe("computeOrderMetrics", () => {
  it("computes revenue, orders, units, AOV", () => {
    const rows = [
      { revenue: 100, quantity: 2, status: "completed" },
      { revenue: 200, quantity: 3, status: "completed" },
      { revenue: 50, quantity: 1, status: "cancelled" },
    ]
    const result = computeOrderMetrics(rows)
    expect(result.revenue).toBe(300)
    expect(result.orders).toBe(2)
    expect(result.units).toBe(5)
    expect(result.averageOrderValue).toBe(150)
    expect(result.returns).toBe(1)
  })

  it("handles empty rows", () => {
    const result = computeOrderMetrics([])
    expect(result.revenue).toBe(0)
    expect(result.orders).toBe(0)
  })

  it("handles currency formatted values", () => {
    const rows = [{ revenue: "₹1,500", quantity: "3", status: "completed" }]
    const result = computeOrderMetrics(rows)
    expect(result.revenue).toBe(1500)
    expect(result.units).toBe(3)
  })
})

describe("computePeriodComparison", () => {
  it("computes period comparison across dates", () => {
    const rows = [
      { order_date: "2024-03-30", revenue: 100, quantity: 1, status: "completed" },
      { order_date: "2024-03-15", revenue: 200, quantity: 2, status: "completed" },
      { order_date: "2024-02-15", revenue: 150, quantity: 1, status: "completed" },
    ]
    const result = computePeriodComparison(rows)
    expect(result.latestDate).toBe("2024-03-30")
    expect(result.currentRevenue).toBe(300)
    expect(result.previousRevenue).toBe(150)
    expect(result.revenueChange).toBe(100)
  })

  it("handles empty rows", () => {
    const result = computePeriodComparison([])
    expect(result.currentRevenue).toBe(0)
    expect(result.previousRevenue).toBe(0)
    expect(result.latestDate).toBeNull()
  })
})

describe("computeInventoryMetrics", () => {
  it("computes stock levels", () => {
    const rows = [
      { product: "A", stock_qty: 100, reorder_level: 20, unit_cost: 10 },
      { product: "B", stock_qty: 5, reorder_level: 20, unit_cost: 15 },
      { product: "C", stock_qty: 0, reorder_level: 10, unit_cost: 5 },
    ]
    const result = computeInventoryMetrics(rows)
    expect(result.recordCount).toBe(3)
    expect(result.healthyCount).toBe(1)
    expect(result.lowStockCount).toBe(1)
    expect(result.outOfStockCount).toBe(1)
    expect(result.totalValue).toBe(100 * 10 + 5 * 15 + 0 * 5)
    expect(result.hasReorderData).toBe(true)
  })

  it("handles missing reorder data", () => {
    const rows = [
      { product: "A", stock_qty: 100 },
      { product: "B", stock_qty: 3 },
    ]
    const result = computeInventoryMetrics(rows)
    expect(result.hasReorderData).toBe(false)
  })

  it("handles empty rows", () => {
    const result = computeInventoryMetrics([])
    expect(result.recordCount).toBe(0)
    expect(result.totalValue).toBe(0)
  })
})

describe("computeSupplierMetrics", () => {
  it("computes risk scores", () => {
    const rows = [
      { supplier: "Acme", lead_time: 15, reliability: 70, status: "Active" },
      { supplier: "Beta", lead_time: 5, reliability: 95, status: "Active" },
      { supplier: "Delta", lead_time: 12, reliability: 60, status: "At Risk" },
    ]
    const result = computeSupplierMetrics(rows)
    expect(result.count).toBe(3)
    expect(result.riskyCount).toBe(2)
  })

  it("handles empty rows", () => {
    const result = computeSupplierMetrics([])
    expect(result.count).toBe(0)
    expect(result.riskyCount).toBe(0)
  })
})

describe("computeCustomerMetrics", () => {
  it("counts unique and repeat customers", () => {
    const rows = [
      { customer: "Alice", revenue: 100, quantity: 1 },
      { customer: "Alice", revenue: 200, quantity: 2 },
      { customer: "Bob", revenue: 150, quantity: 1 },
    ]
    const result = computeCustomerMetrics(rows)
    expect(result.uniqueCount).toBe(2)
    expect(result.repeatCount).toBe(1)
    expect(result.topCustomers).toHaveLength(2)
    expect(result.topCustomers[0].name).toBe("Alice")
    expect(result.topCustomers[0].revenue).toBe(300)
  })
})

describe("computeProductMetrics", () => {
  it("ranks products by revenue", () => {
    const rows = [
      { product: "Widget A", revenue: 500, quantity: 10 },
      { product: "Widget B", revenue: 300, quantity: 5 },
      { product: "Widget A", revenue: 200, quantity: 4 },
    ]
    const result = computeProductMetrics(rows)
    expect(result.uniqueCount).toBe(2)
    expect(result.topProducts[0].name).toBe("Widget A")
    expect(result.topProducts[0].revenue).toBe(700)
  })
})
