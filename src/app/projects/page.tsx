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
    <div className="p-8 max-w-[1500px] mx-auto w-full">
      <div className="mb-8">
        <Breadcrumbs items={[{ label: "Investigate", href: "/dashboard" }, { label: "Projects", href: "/projects" }]} />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#17153B] tracking-tight">Project Intelligence</h1>
        <p className="text-[#68647A] mt-2">Track progress, health, and deadlines across all initiatives.</p>
      </div>

      <ProjectsView data={viewData} />
    </div>
  )
}
