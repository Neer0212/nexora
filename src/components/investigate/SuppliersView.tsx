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
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-zinc-200 shadow-sm text-center">
        <PackageSearch className="w-16 h-16 text-blue-200 mb-6" />
        <h2 className="text-2xl font-semibold text-zinc-950 mb-2">No supplier data connected yet</h2>
        <p className="text-zinc-500 mb-8 text-center max-w-md">
          Connect your supplier or vendor data to start tracking lead times, reliability, and risk.
        </p>
        <Link href="/data-hub" className="px-6 py-3 bg-zinc-950 text-white rounded-xl hover:bg-blue-800 transition-colors inline-flex items-center gap-2 font-medium">
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
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-zinc-50 rounded-lg text-blue-600">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-medium font-semibold text-blue-600">Total Suppliers</h3>
          </div>
          <p className="text-3xl font-semibold text-zinc-950">{metrics.count}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-zinc-50 rounded-lg text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-medium font-semibold text-blue-600">Avg Lead Time</h3>
          </div>
          <p className="text-3xl font-semibold text-zinc-950">
            {metrics.averageLeadTime !== null ? `${metrics.averageLeadTime.toFixed(1)} days` : "N/A"}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#FFF5F5] rounded-lg text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-medium font-semibold text-blue-600">High-Risk</h3>
          </div>
          <p className="text-3xl font-semibold text-zinc-950">{metrics.riskyCount}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#F0FFF4] rounded-lg text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-medium font-semibold text-blue-600">Reliability Data</h3>
          </div>
          <p className="text-3xl font-semibold text-zinc-950">
            {metrics.hasReliabilityData ? "Detected" : "Unavailable"}
          </p>
        </div>
      </div>

      <div className="bg-[#FFF8E7] text-amber-500 p-4 rounded-xl text-sm flex items-start gap-3 border border-[#FBECCB]">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <p><strong>Note:</strong> Risk metrics are deterministic calculations based on connected fields. Do not pretend to predict supplier failure.</p>
      </div>

      {/* Supplier Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200">
          <h3 className="text-lg font-semibold text-zinc-950">Supplier Directory</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium font-semibold text-blue-600">Name</th>
                <th className="px-6 py-4 text-left text-xs font-medium font-semibold text-blue-600">Lead Time (days)</th>
                <th className="px-6 py-4 text-left text-xs font-medium font-semibold text-blue-600">Reliability (%)</th>
                <th className="px-6 py-4 text-left text-xs font-medium font-semibold text-blue-600">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium font-semibold text-blue-600">Risk Level</th>
                <th className="px-6 py-4 text-left text-xs font-medium font-semibold text-blue-600">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {supplierList.map((supplier, idx) => {
                const isHigh = supplier.riskLevel === "High"
                const isMedium = supplier.riskLevel === "Medium"
                return (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-950">{supplier.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{supplier.leadTime !== null ? `${supplier.leadTime}d` : "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{supplier.reliability !== null ? `${supplier.reliability}%` : "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 capitalize">{supplier.status || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isHigh ? "bg-[#FFF5F5] text-rose-600" :
                        isMedium ? "bg-[#FFF8E7] text-amber-500" :
                        "bg-[#F0FFF4] text-emerald-600"
                      }`}>
                        {supplier.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">{supplier.riskScore}</td>
                  </tr>
                )
              })}
              {supplierList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 text-sm">
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
