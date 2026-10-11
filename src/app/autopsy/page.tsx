import { redirect } from "next/navigation"
import { getWorkspaceData } from "@/lib/workspace-data"
import { rowsForDomain } from "@/lib/dataset-utils"
import { text, num } from "@/lib/data-utils"
import {
  computeOrderMetrics,
  computePeriodComparison,
  computeInventoryMetrics,
  computeSupplierMetrics,
  computeCustomerMetrics,
  computeProductMetrics,
} from "@/lib/business-metrics"
import AutopsyView from "@/components/investigate/AutopsyView"

export default async function AutopsyPage() {
  let result
  try {
    result = await getWorkspaceData()
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "AUTH_REQUIRED") redirect("/login")
    if (e instanceof Error && e.message === "BUSINESS_REQUIRED") redirect("/onboarding")
    throw e
  }

  const salesRows = rowsForDomain(result.rows, "sales")
  const inventoryRows = rowsForDomain(result.rows, "inventory")
  const supplierRows = rowsForDomain(result.rows, "suppliers")
  const financeRows = rowsForDomain(result.rows, "finance")

  const comparison = computePeriodComparison(salesRows)
  const orderMetrics = computeOrderMetrics(salesRows)
  const inventoryMetrics = computeInventoryMetrics(inventoryRows)
  const supplierMetrics = computeSupplierMetrics(supplierRows)
  const customerMetrics = computeCustomerMetrics(salesRows)
  const productMetrics = computeProductMetrics(salesRows)

  // Aggregate expenses from finance rows
  const expenseCategories = new Map<string, number>()
  let totalExpenses = 0
  financeRows.forEach((r) => {
    const amount = num(r.amount ?? r.expense ?? 0)
    totalExpenses += amount
    const cat = text(r.expense_category ?? r.category ?? "General") || "General"
    expenseCategories.set(cat, (expenseCategories.get(cat) ?? 0) + amount)
  })
  const topExpenseEntry = [...expenseCategories.entries()].sort((a, b) => b[1] - a[1])[0]

  const data = {
    industryConfig: result.context.industryConfig,
    businessName: result.context.businessName,
    currencyCode: result.context.currencyCode || "INR",
    latestDate: comparison.latestDate,
    datasets: result.datasets.map((d) => d.name),
    comparison: {
      currentRevenue: comparison.currentRevenue,
      previousRevenue: comparison.previousRevenue,
      revenueChange: comparison.revenueChange,
      currentOrders: comparison.currentOrders,
      previousOrders: comparison.previousOrders,
      ordersChange: comparison.ordersChange,
      currentUnits: comparison.currentUnits,
      previousUnits: comparison.previousUnits,
      currentAOV: comparison.currentAOV,
      previousAOV: comparison.previousAOV,
      aovChange: comparison.aovChange,
    },
    orderMetrics: {
      revenue: orderMetrics.revenue,
      orders: orderMetrics.orders,
      units: orderMetrics.units,
      averageOrderValue: orderMetrics.averageOrderValue,
      returns: orderMetrics.returns,
      totalRows: orderMetrics.totalRows,
    },
    inventoryMetrics: {
      totalValue: inventoryMetrics.totalValue,
      recordCount: inventoryMetrics.recordCount,
      lowStockCount: inventoryMetrics.lowStockCount,
      outOfStockCount: inventoryMetrics.outOfStockCount,
      hasReorderData: inventoryMetrics.hasReorderData,
      items: (inventoryMetrics.items || []).map((i) => ({
        product: i.product,
        sku: i.sku,
        currentStock: i.currentStock,
        reorderLevel: i.reorderLevel,
        status: i.status,
        unitCost: i.unitCost,
        inventoryValue: i.inventoryValue,
      })),
    },
    supplierMetrics: {
      count: supplierMetrics.count,
      riskyCount: supplierMetrics.riskyCount,
      averageLeadTime: supplierMetrics.averageLeadTime,
      hasReliabilityData: supplierMetrics.hasReliabilityData,
      items: (supplierMetrics.items || []).map((s) => ({
        name: s.name,
        leadTime: s.leadTime,
        reliability: s.reliability,
        status: s.status,
        riskLevel: s.riskLevel,
      })),
    },
    expenseMetrics: {
      totalAmount: totalExpenses,
      count: financeRows.length,
      topCategory: topExpenseEntry ? { name: topExpenseEntry[0], amount: topExpenseEntry[1] } : null,
    },
    customerCount: customerMetrics.uniqueCount,
    topProducts: productMetrics.topProducts.map((p) => ({
      id: p.id,
      name: p.name,
      revenue: p.revenue,
      units: p.units,
      orders: p.orders,
      share: p.share,
      category: p.category,
    })),
    topCustomers: customerMetrics.topCustomers.map((c) => ({
      name: c.name,
      revenue: c.revenue,
      share: c.share,
    })),
  }

  return <AutopsyView {...data} />
}
