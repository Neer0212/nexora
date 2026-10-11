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
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-8">
      <div>
        <Breadcrumbs items={[{ label: "Overview", href: "/dashboard" }, { label: "Investigate", href: "/autopsy" }, { label: "Suppliers" }]} />
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Supply Chain
            </p>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold text-zinc-950 tracking-tight sm:text-4xl">Suppliers & Vendors</h1>
          <p className="text-zinc-500 mt-1.5 text-sm">Monitor supplier lead times, reliability, and risk across your supply chain.</p>
        </div>
      </div>

      <SuppliersView data={viewData} />
    </div>
  )
}
