import { describe, it, expect } from "vitest"
import {
  computeOrderMetrics,
  computePeriodComparison,
  computeInventoryMetrics,
  computeSupplierMetrics,
} from "@/lib/business-metrics"

type Row = Record<string, unknown>

describe("Phase 12: Business Autopsy / Investigate Logic", () => {
  it("detects revenue decline signal with trailing 30-day period comparison", () => {
    // Generate dates: 30 days of recent orders and 30 days of previous orders
    const currentOrders: Row[] = [
      { order_id: "1", date: "2026-10-05", revenue: 50, quantity: 2, status: "completed" },
      { order_id: "2", date: "2026-09-20", revenue: 50, quantity: 2, status: "completed" },
    ]
    const previousOrders: Row[] = [
      { order_id: "3", date: "2026-08-25", revenue: 100, quantity: 4, status: "completed" },
      { order_id: "4", date: "2026-08-15", revenue: 100, quantity: 4, status: "completed" },
    ]

    const allRows = [...currentOrders, ...previousOrders]
    const comparison = computePeriodComparison(allRows)

    expect(comparison.currentRevenue).toBe(100)
    expect(comparison.previousRevenue).toBe(200)
    expect(comparison.revenueChange).toBe(-50)
    expect(comparison.revenueChange !== null && comparison.revenueChange <= -5.0).toBe(true)
  })

  it("detects stable baseline when revenue variance is within +/- 5%", () => {
    const allRows: Row[] = [
      { order_id: "1", date: "2026-10-05", revenue: 100, quantity: 2, status: "completed" },
      { order_id: "2", date: "2026-08-25", revenue: 102, quantity: 2, status: "completed" },
    ]

    const comparison = computePeriodComparison(allRows)
    const change = comparison.revenueChange

    expect(change).not.toBeNull()
    const isDecline = change !== null && change <= -5.0
    const isGrowth = change !== null && change >= 5.0
    const isStable = change !== null && !isDecline && !isGrowth

    expect(isDecline).toBe(false)
    expect(isGrowth).toBe(false)
    expect(isStable).toBe(true)
  })

  it("identifies inventory stockouts as potential contributing factors", () => {
    const inventoryRows: Row[] = [
      {
        product: "Artisan Ceramic Mug",
        sku: "MUG-001",
        stock: 0,
        reorder_level: 15,
        cost: 120,
      },
      {
        product: "Oat Milk 1L",
        sku: "MILK-003",
        stock: 5,
        reorder_level: 10,
        cost: 180,
      },
      {
        product: "Espresso Blend 1kg",
        sku: "COF-002",
        stock: 45,
        reorder_level: 10,
        cost: 650,
      },
    ]

    const inventory = computeInventoryMetrics(inventoryRows)
    expect(inventory.recordCount).toBe(3)
    expect(inventory.outOfStockCount).toBe(1)
    expect(inventory.lowStockCount).toBe(1)

    const outOfStockItem = inventory.items.find((i) => i.currentStock === 0)
    expect(outOfStockItem).toBeDefined()
    expect(outOfStockItem?.status).toBe("Out of stock")
  })

  it("identifies supplier risk signals with lead times and reliability", () => {
    const supplierRows: Row[] = [
      {
        supplier: "Global Beans Import",
        lead_time_days: 28,
        reliability_score: 65,
        status: "active",
      },
      {
        supplier: "Local Dairy Co",
        lead_time_days: 2,
        reliability_score: 98,
        status: "active",
      },
    ]

    const suppliers = computeSupplierMetrics(supplierRows)
    expect(suppliers.count).toBe(2)
    expect(suppliers.riskyCount).toBe(1)

    const riskySupplier = suppliers.items.find((s) => s.riskLevel === "High" || s.riskLevel === "Medium")
    expect(riskySupplier).toBeDefined()
    expect(riskySupplier?.name).toBe("Global Beans Import")
  })

  it("flags insufficient evidence state when revenue shifts but operational trace data is missing", () => {
    const currentOrders: Row[] = [
      { order_id: "1", date: "2026-10-05", revenue: 50, quantity: 2, status: "completed" },
    ]
    const previousOrders: Row[] = [
      { order_id: "2", date: "2026-08-25", revenue: 200, quantity: 8, status: "completed" },
    ]

    const comparison = computePeriodComparison([...currentOrders, ...previousOrders])
    const revChange = comparison.revenueChange
    const isDecline = revChange !== null && revChange <= -5.0
    const isGrowth = revChange !== null && revChange >= 5.0

    // No products, inventory, or suppliers
    const topProducts: unknown[] = []
    const inventoryRecordCount = 0
    const supplierCount = 0

    const hasAttributionEvidence = Boolean(
      topProducts.length > 0 || inventoryRecordCount > 0 || supplierCount > 0
    )
    const isInsufficientEvidence = (isDecline || isGrowth) && !hasAttributionEvidence

    expect(isDecline).toBe(true)
    expect(isInsufficientEvidence).toBe(true)
  })

  it("flags completely empty state when no orders, inventory, or suppliers are present", () => {
    const orderMetrics = computeOrderMetrics([])
    const inventoryMetrics = computeInventoryMetrics([])
    const supplierMetrics = computeSupplierMetrics([])

    const hasOrders = orderMetrics.totalRows > 0 || orderMetrics.orders > 0
    const isCompletelyEmpty =
      !hasOrders && inventoryMetrics.recordCount === 0 && supplierMetrics.count === 0

    expect(isCompletelyEmpty).toBe(true)
  })
})
