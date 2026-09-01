import { redirect } from "next/navigation"
import { getWorkspaceData } from "@/lib/workspace-data"
import { rowsForDomain } from "@/lib/dataset-utils"
import { computeSupplierMetrics } from "@/lib/business-metrics"
import SuppliersView from "@/components/investigate/SuppliersView"
import Breadcrumbs from "@/components/layout/Breadcrumbs"

export default async function SuppliersPage() {
  let result
  try {
    result = await getWorkspaceData()
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "AUTH_REQUIRED") redirect("/login")
    if (e instanceof Error && e.message === "BUSINESS_REQUIRED") redirect("/onboarding")
    throw e
  }

  const supplierRows = rowsForDomain(result.rows, "suppliers")
  const metrics = computeSupplierMetrics(supplierRows)

  const viewData = {
    businessName: result.context.businessName,
    currencyCode: result.context.currencyCode,
    latestDate: null,
    datasets: result.datasets.map((d) => d.name),
    metrics,
  }

  return (
    <div className="p-8 max-w-[1500px] mx-auto w-full">
      <div className="mb-8">
        <Breadcrumbs items={[{ label: "Investigate", href: "/dashboard" }, { label: "Suppliers", href: "/suppliers" }]} />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#17153B] tracking-tight">Suppliers & Vendors</h1>
        <p className="text-[#68647A] mt-2">Monitor supplier lead times, reliability, and risk across your supply chain.</p>
      </div>

      <SuppliersView data={viewData} />
    </div>
  )
}
