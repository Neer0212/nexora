import { redirect } from "next/navigation"
import { getWorkspaceData } from "@/lib/workspace-data"
import { rowsForDomain } from "@/lib/dataset-utils"
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
  let result;
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

  const comparison = computePeriodComparison(salesRows)
  const orderMetrics = computeOrderMetrics(salesRows)
  const inventoryMetrics = computeInventoryMetrics(inventoryRows)
  const supplierMetrics = computeSupplierMetrics(supplierRows)
  const customerMetrics = computeCustomerMetrics(salesRows)
  const productMetrics = computeProductMetrics(salesRows)

  const data = {
    businessName: result.context.businessName,
    currencyCode: result.context.currencyCode,
    latestDate: comparison.latestDate,
    datasets: result.datasets.map(d => d.name),
    comparison: {
      currentRevenue: comparison.currentRevenue,
      previousRevenue: comparison.previousRevenue,
      revenueChange: comparison.revenueChange,
      currentOrders: comparison.currentOrders,
      previousOrders: comparison.previousOrders,
      ordersChange: comparison.ordersChange,
      currentAOV: comparison.currentAOV,
      previousAOV: comparison.previousAOV,
      aovChange: comparison.aovChange
    },
    orderMetrics: {
      revenue: orderMetrics.revenue,
      orders: orderMetrics.orders,
      units: orderMetrics.units,
      averageOrderValue: orderMetrics.averageOrderValue,
      returns: orderMetrics.returns
    },
    inventoryMetrics: {
      totalValue: inventoryMetrics.totalValue,
      lowStockCount: inventoryMetrics.lowStockCount,
      outOfStockCount: inventoryMetrics.outOfStockCount
    },
    supplierMetrics: {
      count: supplierMetrics.count,
      riskyCount: supplierMetrics.riskyCount
    },
    customerCount: customerMetrics.uniqueCount,
    topProducts: productMetrics.topProducts.map(p => ({ name: p.name, revenue: p.revenue, share: p.share })),
    topCustomers: customerMetrics.topCustomers.map(c => ({ name: c.name, revenue: c.revenue, share: c.share }))
  }

  return <AutopsyView {...data} />
}
