import { redirect } from "next/navigation"
import { getWorkspaceData } from "@/lib/workspace-data"
import { rowsForDomain } from "@/lib/dataset-utils"
import {
  computeChanges,
  computePeriodComparison,
  computeProductMetrics,
  computeCustomerMetrics,
  computeInventoryMetrics,
  computeOrderMetrics,
} from "@/lib/business-metrics"
import ChangesView from "@/components/investigate/ChangesView"
import Breadcrumbs from "@/components/layout/Breadcrumbs"

export default async function ChangesPage() {
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

  const periodData = computePeriodComparison(salesRows)
  const productMetrics = computeProductMetrics(salesRows)
  const customerMetrics = computeCustomerMetrics(salesRows)
  const inventory = computeInventoryMetrics(inventoryRows)
  const orderMetrics = computeOrderMetrics(salesRows)

  const changes = computeChanges(periodData, inventory, orderMetrics)

  const topProductChanges = productMetrics.topProducts.slice(0, 5)
  const topCustomerChanges = customerMetrics.topCustomers.slice(0, 5)

  const viewData = {
    businessName: result.context.businessName,
    currencyCode: result.context.currencyCode,
    latestDate: periodData.latestDate,
    datasets: result.datasets.map((d) => d.name),
    changes,
    topProductChanges,
    topCustomerChanges,
  }

  return (
    <div className="p-8 max-w-[1500px] mx-auto w-full">
      <div className="mb-8">
        <Breadcrumbs items={[{ label: "Investigate", href: "/dashboard" }, { label: "What Changed", href: "/changes" }]} />
      </div>

      <ChangesView data={viewData} />
    </div>
  )
}
