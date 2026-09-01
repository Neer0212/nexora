/**
 * Nexora — Central business metrics computation.
 *
 * Single source of truth for all business metric calculations.
 * Every analytical page should use these functions rather than
 * independently reimplementing the same aggregations.
 */

import { text, num, parseDate, addDays, isCancelled, keyOf } from "./data-utils"
import { type RowSchema, detectRowSchema } from "./dataset-utils"

type Row = Record<string, unknown>

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OrderMetrics = {
  revenue: number
  orders: number
  units: number
  averageOrderValue: number
  returns: number
  totalRows: number
}

export type PeriodComparison = {
  currentRevenue: number
  previousRevenue: number
  revenueChange: number | null
  currentOrders: number
  previousOrders: number
  ordersChange: number | null
  currentUnits: number
  previousUnits: number
  currentAOV: number
  previousAOV: number
  aovChange: number | null
  latestDate: string | null
  currentStart: string | null
  previousStart: string | null
}

export type InventoryMetrics = {
  totalValue: number
  recordCount: number
  lowStockCount: number
  outOfStockCount: number
  criticalCount: number
  healthyCount: number
  hasReorderData: boolean
  items: InventoryItem[]
}

export type InventoryItem = {
  product: string
  sku: string
  currentStock: number
  reorderLevel: number | null
  unitCost: number | null
  inventoryValue: number
  status: "Healthy" | "Low" | "Critical" | "Out of stock"
  warehouse: string
}

export type SupplierMetrics = {
  count: number
  riskyCount: number
  averageLeadTime: number | null
  hasReliabilityData: boolean
  items: SupplierItem[]
}

export type SupplierItem = {
  name: string
  leadTime: number | null
  reliability: number | null
  status: string
  riskScore: number
  riskLevel: "High" | "Medium" | "Low"
}

export type CustomerMetrics = {
  uniqueCount: number
  repeatCount: number
  topCustomers: CustomerItem[]
}

export type CustomerItem = {
  id: string
  name: string
  orders: number
  revenue: number
  units: number
  averageOrderValue: number
  share: number
}

export type ProductMetrics = {
  uniqueCount: number
  topProducts: ProductItem[]
}

export type ProductItem = {
  id: string
  name: string
  orders: number
  revenue: number
  units: number
  share: number
  category: string
}

export type ProjectItem = {
  name: string
  owner: string
  status: string
  progress: number | null
  deadline: string | null
  startDate: string | null
  priority: string
  isOverdue: boolean
  healthStatus: "Completed" | "On track" | "At risk" | "Overdue" | "Stalled" | "Unknown"
}

export type ChangeItem = {
  metric: string
  domain: string
  currentValue: number
  previousValue: number
  change: number
  changePercent: number | null
  direction: "up" | "down" | "unchanged"
  magnitude: "large" | "medium" | "small"
  evidence: string
}

// ---------------------------------------------------------------------------
// Order Metrics
// ---------------------------------------------------------------------------

/**
 * Compute aggregate order metrics from sales rows.
 */
export function computeOrderMetrics(rows: Row[], schema?: RowSchema): OrderMetrics {
  const s = schema ?? (rows[0] ? detectRowSchema(rows[0]) : null)
  if (!s) return { revenue: 0, orders: 0, units: 0, averageOrderValue: 0, returns: 0, totalRows: 0 }

  const activeRows = rows.filter((row) => {
    if (!s.status) return true
    return !isCancelled(text(row[s.status]))
  })

  const revenue = activeRows.reduce((sum, row) => sum + (s.revenue ? num(row[s.revenue]) : 0), 0)
  const units = activeRows.reduce((sum, row) => sum + (s.quantity ? num(row[s.quantity]) : 0), 0)
  const orders = activeRows.length
  const returns = rows.length - activeRows.length

  return {
    revenue,
    orders,
    units,
    averageOrderValue: orders > 0 ? revenue / orders : 0,
    returns,
    totalRows: rows.length,
  }
}

// ---------------------------------------------------------------------------
// Period Comparison
// ---------------------------------------------------------------------------

/**
 * Compare current 30-day period vs previous 30-day period.
 */
export function computePeriodComparison(
  rows: Row[],
  schema?: RowSchema
): PeriodComparison {
  const s = schema ?? (rows[0] ? detectRowSchema(rows[0]) : null)

  const empty: PeriodComparison = {
    currentRevenue: 0, previousRevenue: 0, revenueChange: null,
    currentOrders: 0, previousOrders: 0, ordersChange: null,
    currentUnits: 0, previousUnits: 0,
    currentAOV: 0, previousAOV: 0, aovChange: null,
    latestDate: null, currentStart: null, previousStart: null,
  }

  if (!s || !s.date) return empty

  // Filter active orders with dates
  const dated = rows
    .map((row) => ({ row, date: parseDate(row[s.date!]), cancelled: s.status ? isCancelled(text(row[s.status])) : false }))
    .filter((item): item is typeof item & { date: string } => item.date !== null && !item.cancelled)

  if (dated.length === 0) return empty

  const latestDate = dated.reduce((max, item) => item.date > max ? item.date : max, dated[0].date)
  const currentStart = addDays(latestDate, -29)
  const previousEnd = addDays(currentStart, -1)
  const previousStart = addDays(previousEnd, -29)

  const current = dated.filter((item) => item.date >= currentStart && item.date <= latestDate)
  const previous = dated.filter((item) => item.date >= previousStart && item.date <= previousEnd)

  const sumRevenue = (items: typeof dated) =>
    items.reduce((sum, item) => sum + (s.revenue ? num(item.row[s.revenue]) : 0), 0)
  const sumUnits = (items: typeof dated) =>
    items.reduce((sum, item) => sum + (s.quantity ? num(item.row[s.quantity]) : 0), 0)

  const currentRevenue = sumRevenue(current)
  const previousRevenue = sumRevenue(previous)
  const currentOrders = current.length
  const previousOrders = previous.length
  const currentUnits = sumUnits(current)
  const previousUnits = sumUnits(previous)
  const currentAOV = currentOrders > 0 ? currentRevenue / currentOrders : 0
  const previousAOV = previousOrders > 0 ? previousRevenue / previousOrders : 0

  const pctChange = (curr: number, prev: number) =>
    prev === 0 ? (curr > 0 ? null : 0) : ((curr - prev) / prev) * 100

  return {
    currentRevenue,
    previousRevenue,
    revenueChange: pctChange(currentRevenue, previousRevenue),
    currentOrders,
    previousOrders,
    ordersChange: pctChange(currentOrders, previousOrders),
    currentUnits,
    previousUnits,
    currentAOV,
    previousAOV,
    aovChange: pctChange(currentAOV, previousAOV),
    latestDate,
    currentStart,
    previousStart,
  }
}

// ---------------------------------------------------------------------------
// Inventory Metrics
// ---------------------------------------------------------------------------

/**
 * Compute inventory metrics from inventory-classified rows.
 */
export function computeInventoryMetrics(rows: Row[], schema?: RowSchema): InventoryMetrics {
  const s = schema ?? (rows[0] ? detectRowSchema(rows[0]) : null)

  if (!s || rows.length === 0) {
    return {
      totalValue: 0, recordCount: 0, lowStockCount: 0,
      outOfStockCount: 0, criticalCount: 0, healthyCount: 0,
      hasReorderData: false, items: [],
    }
  }

  const hasReorderData = s.reorderLevel !== null

  const items: InventoryItem[] = rows.map((row) => {
    const currentStock = s.stockQty ? num(row[s.stockQty]) : 0
    const reorderLevel = s.reorderLevel ? num(row[s.reorderLevel]) : null
    const unitCost = s.unitCost ? num(row[s.unitCost]) : null
    const product = s.product ? text(row[s.product]) : (s.entityName ? text(row[s.entityName]) : "Unknown")
    const sku = keyOf(row, ["sku", "product_code", "item_code"])
    const warehouse = s.warehouse ? text(row[s.warehouse]) : ""

    let status: InventoryItem["status"] = "Healthy"
    if (currentStock <= 0) {
      status = "Out of stock"
    } else if (reorderLevel !== null && currentStock <= reorderLevel * 0.5) {
      status = "Critical"
    } else if (reorderLevel !== null && currentStock <= reorderLevel) {
      status = "Low"
    } else if (reorderLevel === null && currentStock <= 5) {
      status = "Critical"
    } else if (reorderLevel === null && currentStock <= 10) {
      status = "Low"
    }

    return {
      product: product || "Unknown product",
      sku: sku ? text(row[sku]) : "",
      currentStock,
      reorderLevel,
      unitCost,
      inventoryValue: unitCost !== null ? currentStock * unitCost : 0,
      status,
      warehouse,
    }
  })

  return {
    totalValue: items.reduce((sum, item) => sum + item.inventoryValue, 0),
    recordCount: items.length,
    lowStockCount: items.filter((i) => i.status === "Low" || i.status === "Critical").length,
    outOfStockCount: items.filter((i) => i.status === "Out of stock").length,
    criticalCount: items.filter((i) => i.status === "Critical").length,
    healthyCount: items.filter((i) => i.status === "Healthy").length,
    hasReorderData,
    items,
  }
}

// ---------------------------------------------------------------------------
// Supplier Metrics
// ---------------------------------------------------------------------------

/**
 * Compute supplier metrics from supplier-classified rows.
 */
export function computeSupplierMetrics(rows: Row[], schema?: RowSchema): SupplierMetrics {
  const s = schema ?? (rows[0] ? detectRowSchema(rows[0]) : null)

  if (!s || rows.length === 0) {
    return { count: 0, riskyCount: 0, averageLeadTime: null, hasReliabilityData: false, items: [] }
  }

  const hasReliabilityData = s.reliability !== null

  const items: SupplierItem[] = rows.map((row) => {
    const name = s.supplierName ? text(row[s.supplierName]) : "Unknown supplier"
    const leadTime = s.leadTime ? num(row[s.leadTime]) : null
    const reliability = s.reliability ? num(row[s.reliability]) : null
    const statusKey = keyOf(row, ["status", "supplier_status"])
    const status = statusKey ? text(row[statusKey]) : "Active"

    // Deterministic risk scoring
    let riskScore = 0
    const statusLower = status.toLowerCase()
    if (["watch", "at risk", "risk", "delayed", "poor", "inactive"].some((term) => statusLower.includes(term))) {
      riskScore += 2
    }
    if (leadTime !== null && leadTime >= 10) riskScore += 1
    if (reliability !== null && reliability < 80) riskScore += 1

    const riskLevel: SupplierItem["riskLevel"] = riskScore >= 3 ? "High" : riskScore >= 1 ? "Medium" : "Low"

    return { name: name || "Unknown supplier", leadTime, reliability, status, riskScore, riskLevel }
  })

  const leadTimes = items.filter((i) => i.leadTime !== null).map((i) => i.leadTime!)
  const averageLeadTime = leadTimes.length > 0
    ? leadTimes.reduce((sum, lt) => sum + lt, 0) / leadTimes.length
    : null

  return {
    count: items.length,
    riskyCount: items.filter((i) => i.riskLevel !== "Low").length,
    averageLeadTime,
    hasReliabilityData,
    items: items.sort((a, b) => b.riskScore - a.riskScore),
  }
}

// ---------------------------------------------------------------------------
// Customer Metrics
// ---------------------------------------------------------------------------

/**
 * Compute customer metrics from order rows.
 */
export function computeCustomerMetrics(
  orderRows: Row[],
  schema?: RowSchema
): CustomerMetrics {
  const s = schema ?? (orderRows[0] ? detectRowSchema(orderRows[0]) : null)

  if (!s || !s.customer) {
    return { uniqueCount: 0, repeatCount: 0, topCustomers: [] }
  }

  const customerMap = new Map<string, { orders: number; revenue: number; units: number }>()
  const activeRows = orderRows.filter((row) => !s.status || !isCancelled(text(row[s.status])))

  for (const row of activeRows) {
    const id = text(row[s.customer!])
    if (!id) continue
    const current = customerMap.get(id) ?? { orders: 0, revenue: 0, units: 0 }
    current.orders += 1
    current.revenue += s.revenue ? num(row[s.revenue]) : 0
    current.units += s.quantity ? num(row[s.quantity]) : 0
    customerMap.set(id, current)
  }

  const totalRevenue = [...customerMap.values()].reduce((sum, c) => sum + c.revenue, 0)

  const topCustomers: CustomerItem[] = [...customerMap.entries()]
    .map(([id, data]) => ({
      id,
      name: id,
      orders: data.orders,
      revenue: data.revenue,
      units: data.units,
      averageOrderValue: data.orders > 0 ? data.revenue / data.orders : 0,
      share: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 25)

  const repeatCount = [...customerMap.values()].filter((c) => c.orders > 1).length

  return {
    uniqueCount: customerMap.size,
    repeatCount,
    topCustomers,
  }
}

// ---------------------------------------------------------------------------
// Product Metrics
// ---------------------------------------------------------------------------

/**
 * Compute product metrics from order rows.
 */
export function computeProductMetrics(
  orderRows: Row[],
  schema?: RowSchema
): ProductMetrics {
  const s = schema ?? (orderRows[0] ? detectRowSchema(orderRows[0]) : null)

  if (!s || !s.product) {
    return { uniqueCount: 0, topProducts: [] }
  }

  const productMap = new Map<string, { orders: number; revenue: number; units: number; category: string }>()
  const activeRows = orderRows.filter((row) => !s.status || !isCancelled(text(row[s.status])))

  for (const row of activeRows) {
    const id = text(row[s.product!])
    if (!id) continue
    const current = productMap.get(id) ?? { orders: 0, revenue: 0, units: 0, category: "" }
    current.orders += 1
    current.revenue += s.revenue ? num(row[s.revenue]) : 0
    current.units += s.quantity ? num(row[s.quantity]) : 0
    if (!current.category && s.category) {
      current.category = text(row[s.category])
    }
    productMap.set(id, current)
  }

  const totalRevenue = [...productMap.values()].reduce((sum, p) => sum + p.revenue, 0)

  const topProducts: ProductItem[] = [...productMap.entries()]
    .map(([id, data]) => ({
      id,
      name: id,
      orders: data.orders,
      revenue: data.revenue,
      units: data.units,
      share: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
      category: data.category,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 25)

  return {
    uniqueCount: productMap.size,
    topProducts,
  }
}

// ---------------------------------------------------------------------------
// Project Metrics
// ---------------------------------------------------------------------------

/**
 * Compute project health from project-classified rows.
 */
export function computeProjectMetrics(rows: Row[], schema?: RowSchema): ProjectItem[] {
  const s = schema ?? (rows[0] ? detectRowSchema(rows[0]) : null)
  if (!s) return []

  const today = new Date().toISOString().slice(0, 10)

  return rows.map((row) => {
    const name = s.projectName ? text(row[s.projectName]) : "Unknown project"
    const owner = s.owner ? text(row[s.owner]) : "—"
    const status = s.status ? text(row[s.status]) : "—"
    const progress = s.progress ? num(row[s.progress]) : null
    const deadline = s.deadline ? parseDate(row[s.deadline]) : null
    const startDate = s.startDate ? parseDate(row[s.startDate]) : null
    const priority = s.priority ? text(row[s.priority]) : "—"

    const isOverdue = deadline !== null && deadline < today && status.toLowerCase() !== "completed"

    let healthStatus: ProjectItem["healthStatus"] = "Unknown"
    const statusLower = status.toLowerCase()
    if (statusLower === "completed" || statusLower === "done" || statusLower === "finished") {
      healthStatus = "Completed"
    } else if (isOverdue) {
      healthStatus = "Overdue"
    } else if (progress !== null && progress < 25 && startDate !== null && startDate < addDays(today, -14)) {
      healthStatus = "Stalled"
    } else if (
      (deadline !== null && deadline <= addDays(today, 7) && (progress === null || progress < 80)) ||
      statusLower.includes("risk")
    ) {
      healthStatus = "At risk"
    } else if (statusLower !== "—") {
      healthStatus = "On track"
    }

    return { name, owner, status, progress, deadline, startDate, priority, isOverdue, healthStatus }
  })
}

// ---------------------------------------------------------------------------
// What Changed Comparison
// ---------------------------------------------------------------------------

/**
 * Compare current vs previous period across multiple dimensions.
 */
export function computeChanges(
  comparison: PeriodComparison,
  inventoryCurrent: InventoryMetrics,
  orderMetrics: OrderMetrics
): ChangeItem[] {
  const changes: ChangeItem[] = []

  const addChange = (
    metric: string,
    domain: string,
    currentValue: number,
    previousValue: number,
    evidence: string
  ) => {
    const diff = currentValue - previousValue
    const changePercent = previousValue === 0
      ? (currentValue > 0 ? null : 0)
      : ((currentValue - previousValue) / previousValue) * 100
    const direction: ChangeItem["direction"] = diff > 0 ? "up" : diff < 0 ? "down" : "unchanged"
    const absPct = Math.abs(changePercent ?? 0)
    const magnitude: ChangeItem["magnitude"] = absPct >= 15 ? "large" : absPct >= 5 ? "medium" : "small"

    changes.push({
      metric, domain, currentValue, previousValue,
      change: diff, changePercent, direction, magnitude, evidence,
    })
  }

  addChange("Revenue", "sales", comparison.currentRevenue, comparison.previousRevenue, "30-day period comparison")
  addChange("Orders", "sales", comparison.currentOrders, comparison.previousOrders, "30-day period comparison")
  addChange("Average Order Value", "sales", comparison.currentAOV, comparison.previousAOV, "30-day period comparison")

  if (orderMetrics.returns > 0) {
    addChange("Returns", "sales", orderMetrics.returns, 0, "Connected order data")
  }

  if (inventoryCurrent.recordCount > 0) {
    addChange("Inventory Records", "inventory", inventoryCurrent.recordCount, 0, "Connected inventory data")
    addChange("Low Stock Items", "inventory", inventoryCurrent.lowStockCount, 0, "Connected inventory data")
  }

  return changes.sort((a, b) => Math.abs(b.changePercent ?? 0) - Math.abs(a.changePercent ?? 0))
}
