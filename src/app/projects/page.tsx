import { redirect } from "next/navigation"
import { getWorkspaceData } from "@/lib/workspace-data"
import { rowsForDomain } from "@/lib/dataset-utils"
import { computeProjectMetrics } from "@/lib/business-metrics"
import ProjectsView from "@/components/investigate/ProjectsView"
import Breadcrumbs from "@/components/layout/Breadcrumbs"

export default async function ProjectsPage() {
  let result
  try {
    result = await getWorkspaceData()
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "AUTH_REQUIRED") redirect("/login")
    if (e instanceof Error && e.message === "BUSINESS_REQUIRED") redirect("/onboarding")
    throw e
  }

  const projectRows = rowsForDomain(result.rows, "projects")
  const projects = computeProjectMetrics(projectRows)

  const viewData = {
    businessName: result.context.businessName,
    currencyCode: result.context.currencyCode,
    latestDate: null,
    datasets: result.datasets.map((d) => d.name),
    projects,
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-8">
      <div>
        <Breadcrumbs items={[{ label: "Overview", href: "/dashboard" }, { label: "Investigate", href: "/autopsy" }, { label: "Projects" }]} />
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Initiatives & Delivery
            </p>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold text-zinc-950 tracking-tight sm:text-4xl">Project Intelligence</h1>
          <p className="text-zinc-500 mt-1.5 text-sm">Track progress, health, and deadlines across all operational initiatives.</p>
        </div>
      </div>

      <ProjectsView data={viewData} />
    </div>
  )
}
