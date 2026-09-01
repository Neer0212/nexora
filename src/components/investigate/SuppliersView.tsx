"use client"

import React from "react"
import Link from "next/link"
import { PackageSearch, AlertTriangle, Clock, ShieldCheck, ArrowRight, Building2 } from "lucide-react"
import type { SupplierMetrics } from "@/lib/business-metrics"

type SuppliersData = {
  businessName: string
  currencyCode: string
  latestDate: string | null
  datasets: string[]
  metrics: SupplierMetrics
}

export default function SuppliersView({ data }: { data: SuppliersData }) {
  if (data.datasets.length === 0 || data.metrics.count === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)] text-center">
        <PackageSearch className="w-16 h-16 text-[#C8ACD6] mb-6" />
        <h2 className="text-2xl font-semibold text-[#17153B] mb-2">No supplier data connected yet</h2>
        <p className="text-[#68647A] mb-8 text-center max-w-md">
          Connect your supplier or vendor data to start tracking lead times, reliability, and risk.
        </p>
        <Link href="/data-hub" className="px-6 py-3 bg-[#17153B] text-white rounded-xl hover:bg-[#2E236C] transition-colors inline-flex items-center gap-2 font-medium">
          Connect Data <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  const { metrics } = data
  const supplierList = metrics.items || []

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#F1F0F8] rounded-lg text-[#433D8B]">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">Total Suppliers</h3>
          </div>
          <p className="text-3xl font-semibold text-[#17153B]">{metrics.count}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#F1F0F8] rounded-lg text-[#433D8B]">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">Avg Lead Time</h3>
          </div>
          <p className="text-3xl font-semibold text-[#17153B]">
            {metrics.averageLeadTime !== null ? `${metrics.averageLeadTime.toFixed(1)} days` : "N/A"}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#FFF5F5] rounded-lg text-[#B85454]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">High-Risk</h3>
          </div>
          <p className="text-3xl font-semibold text-[#17153B]">{metrics.riskyCount}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#F0FFF4] rounded-lg text-[#3C8F70]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">Reliability Data</h3>
          </div>
          <p className="text-3xl font-semibold text-[#17153B]">
            {metrics.hasReliabilityData ? "Detected" : "Unavailable"}
          </p>
        </div>
      </div>

      <div className="bg-[#FFF8E7] text-[#C58A3A] p-4 rounded-xl text-sm flex items-start gap-3 border border-[#FBECCB]">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <p><strong>Note:</strong> Risk metrics are deterministic calculations based on connected fields. Do not pretend to predict supplier failure.</p>
      </div>

      {/* Supplier Table */}
      <div className="bg-white rounded-2xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)] overflow-hidden">
        <div className="p-6 border-b border-[#E7E4EF]">
          <h3 className="text-lg font-semibold text-[#17153B]">Supplier Directory</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F1F0F8] border-b border-[#E7E4EF]">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">Name</th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">Lead Time (days)</th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">Reliability (%)</th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">Status</th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">Risk Level</th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E4EF]">
              {supplierList.map((supplier, idx) => {
                const isHigh = supplier.riskLevel === "High"
                const isMedium = supplier.riskLevel === "Medium"
                return (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#17153B]">{supplier.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#68647A]">{supplier.leadTime !== null ? `${supplier.leadTime}d` : "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#68647A]">{supplier.reliability !== null ? `${supplier.reliability}%` : "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#68647A] capitalize">{supplier.status || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isHigh ? "bg-[#FFF5F5] text-[#B85454]" :
                        isMedium ? "bg-[#FFF8E7] text-[#C58A3A]" :
                        "bg-[#F0FFF4] text-[#3C8F70]"
                      }`}>
                        {supplier.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#68647A]">{supplier.riskScore}</td>
                  </tr>
                )
              })}
              {supplierList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#68647A] text-sm">
                    No suppliers found in connected datasets.
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
