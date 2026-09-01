"use client"

import React from "react"
import Link from "next/link"
import { FolderOpen, ArrowRight, CheckCircle2, Clock, AlertTriangle, Briefcase } from "lucide-react"
import type { ProjectItem } from "@/lib/business-metrics"

type ProjectsData = {
  businessName: string
  currencyCode: string
  latestDate: string | null
  datasets: string[]
  projects: ProjectItem[]
}

export default function ProjectsView({ data }: { data: ProjectsData }) {
  if (data.datasets.length === 0 || data.projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)] text-center">
        <FolderOpen className="w-16 h-16 text-[#C8ACD6] mb-6" />
        <h2 className="text-2xl font-semibold text-[#17153B] mb-2">No project data connected yet</h2>
        <p className="text-[#68647A] mb-8 text-center max-w-md">
          Connect your project management data to track progress, health, and deadlines.
        </p>
        <Link href="/data-hub" className="px-6 py-3 bg-[#17153B] text-white rounded-xl hover:bg-[#2E236C] transition-colors inline-flex items-center gap-2 font-medium">
          Connect Data <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  const { projects } = data
  const total = projects.length
  const completed = projects.filter((p) => p.healthStatus === "Completed" || p.status.toLowerCase() === "completed").length
  const overdue = projects.filter((p) => p.healthStatus === "Overdue" || p.isOverdue).length
  const atRisk = projects.filter((p) => p.healthStatus === "At risk").length

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#F1F0F8] rounded-lg text-[#433D8B]">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">Total Projects</h3>
          </div>
          <p className="text-3xl font-semibold text-[#17153B]">{total}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#FFF5F5] rounded-lg text-[#B85454]">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">Overdue</h3>
          </div>
          <p className="text-3xl font-semibold text-[#17153B]">{overdue}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#FFF8E7] rounded-lg text-[#C58A3A]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">At Risk</h3>
          </div>
          <p className="text-3xl font-semibold text-[#17153B]">{atRisk}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#F0FFF4] rounded-lg text-[#3C8F70]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">Completed</h3>
          </div>
          <p className="text-3xl font-semibold text-[#17153B]">{completed}</p>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-2xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)] overflow-hidden">
        <div className="p-6 border-b border-[#E7E4EF]">
          <h3 className="text-lg font-semibold text-[#17153B]">Project Portfolio</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F1F0F8] border-b border-[#E7E4EF]">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">Name</th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">Owner</th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">Status</th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">Progress</th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">Deadline</th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">Priority</th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E4EF]">
              {projects.map((project, idx) => {
                const health = project.healthStatus
                let healthBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{health}</span>
                if (health === "Completed") healthBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F0FFF4] text-[#3C8F70]">Completed</span>
                if (health === "On track") healthBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">On Track</span>
                if (health === "At risk") healthBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FFF8E7] text-[#C58A3A]">At Risk</span>
                if (health === "Overdue") healthBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FFF5F5] text-[#B85454]">Overdue</span>
                if (health === "Stalled") healthBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-[#68647A]">Stalled</span>

                return (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#17153B]">{project.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#68647A]">{project.owner || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#68647A] capitalize">{project.status || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2 min-w-[100px]">
                          <div className="bg-[#433D8B] h-2 rounded-full" style={{ width: `${project.progress ?? 0}%` }}></div>
                        </div>
                        <span className="text-xs text-[#68647A]">{project.progress !== null ? `${project.progress}%` : "—"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#68647A]">
                      {project.deadline ? new Date(project.deadline).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#68647A] capitalize">{project.priority || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{healthBadge}</td>
                  </tr>
                )
              })}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#68647A] text-sm">
                    No projects found in connected datasets.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
