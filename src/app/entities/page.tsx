import { redirect } from "next/navigation"
import { getWorkspaceData } from "@/lib/workspace-data"
import { rowsForDomain } from "@/lib/dataset-utils"
import { computeCustomerMetrics, computeProductMetrics, computePeriodComparison } from "@/lib/business-metrics"
import EntitiesView from "@/components/investigate/EntitiesView"

export default async function EntitiesPage() {
  let result;
  try {
    result = await getWorkspaceData()
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "AUTH_REQUIRED") redirect("/login")
    if (e instanceof Error && e.message === "BUSINESS_REQUIRED") redirect("/onboarding")
    throw e
  }

  const salesRows = rowsForDomain(result.rows, "sales")
  const customerMetrics = computeCustomerMetrics(salesRows)
  const productMetrics = computeProductMetrics(salesRows)
  const comparison = computePeriodComparison(salesRows)

  const data = {
    businessName: result.context.businessName,
    currencyCode: result.context.currencyCode,
    latestDate: comparison.latestDate,
    datasets: result.datasets.map(d => d.name),
    customers: customerMetrics.topCustomers,
    products: productMetrics.topProducts
  }

  return <EntitiesView {...data} />
}
