import { redirect } from "next/navigation"
import { getWorkspaceData } from "@/lib/workspace-data"
import { rowsForDomain } from "@/lib/dataset-utils"
import { computeInventoryMetrics, computePeriodComparison } from "@/lib/business-metrics"
import InventoryView from "@/components/investigate/InventoryView"

export default async function InventoryPage() {
  let result;
  try {
    result = await getWorkspaceData()
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "AUTH_REQUIRED") redirect("/login")
    if (e instanceof Error && e.message === "BUSINESS_REQUIRED") redirect("/onboarding")
    throw e
  }

  const inventoryRows = rowsForDomain(result.rows, "inventory")
  const salesRows = rowsForDomain(result.rows, "sales")
  const inventoryMetrics = computeInventoryMetrics(inventoryRows)
  const comparison = computePeriodComparison(salesRows)

  const data = {
    businessName: result.context.businessName,
    currencyCode: result.context.currencyCode,
    latestDate: comparison.latestDate,
    datasets: result.datasets.map(d => d.name),
    metrics: inventoryMetrics
  }

  return <InventoryView {...data} />
}
