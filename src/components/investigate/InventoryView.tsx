"use client"

import Link from "next/link"
import Breadcrumbs from "@/components/layout/Breadcrumbs"
import { formatCurrency } from "@/lib/data-utils"
import type { InventoryMetrics } from "@/lib/business-metrics"
import { Package, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react"

type InventoryData = {
  businessName: string
  currencyCode: string
  latestDate: string | null
  datasets: string[]
  metrics: InventoryMetrics
}

export default function InventoryView(props: InventoryData) {
  const { metrics, currencyCode } = props

  if (metrics.recordCount === 0) {
    return (
      <div className="max-w-[1500px] mx-auto p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Package size={48} className="text-blue-200 mb-6" />
        <h2 className="text-2xl font-light text-zinc-950 mb-2">No inventory data connected yet</h2>
        <p className="text-zinc-500 mb-8">Connect your inventory datasets to view stock intelligence.</p>
        <Link href="/data-hub" className="bg-zinc-950 text-white px-6 py-3 rounded-xl hover:bg-blue-800 transition-colors">
          Go to Data Hub
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <Breadcrumbs items={[
          { label: "Overview", href: "/dashboard" },
          { label: "Investigate", href: "/autopsy" },
          { label: "Inventory Investigation" }
        ]} />
        <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-600 animate-pulse" />
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600">
                Stock & Valuation
              </p>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
              Inventory Investigation
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500">
              Analyze stock levels, reorder thresholds, and warehouse valuation.
            </p>
          </div>
        </div>
      </div>

      {!metrics.hasReorderData && (
        <div className="bg-[#FFF5F5] border border-[#FEE2E2] rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-rose-600" size={20} />
          <p className="text-rose-600">Reorder levels not detected in connected data. Statuses are estimated.</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <p className="text-xs font-medium font-semibold text-blue-600 mb-2">Total Value</p>
          <p className="text-3xl font-light text-zinc-950">{formatCurrency(metrics.totalValue, currencyCode)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <p className="text-xs font-medium font-semibold text-blue-600 mb-2">Total Records</p>
          <p className="text-3xl font-light text-zinc-950">{metrics.recordCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <p className="text-xs font-medium font-semibold text-blue-600 mb-2">Low Stock</p>
          <p className="text-3xl font-light text-amber-500">{metrics.lowStockCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
          <p className="text-xs font-medium font-semibold text-blue-600 mb-2">Out of Stock</p>
          <p className="text-3xl font-light text-rose-600">{metrics.outOfStockCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-[0.18em]">Product</th>
                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-[0.18em]">SKU</th>
                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-[0.18em] text-right">Current Stock</th>
                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-[0.18em] text-right">Reorder Level</th>
                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-[0.18em] text-right">Value</th>
                <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-[0.18em] text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {metrics.items.map((item, i) => (
                <tr key={i} className="border-b border-zinc-200 hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 text-zinc-950 font-medium">{item.product}</td>
                  <td className="px-6 py-4 text-zinc-500">{item.sku || "—"}</td>
                  <td className="px-6 py-4 text-zinc-950 text-right font-medium">{item.currentStock}</td>
                  <td className="px-6 py-4 text-zinc-500 text-right">{item.reorderLevel ?? "—"}</td>
                  <td className="px-6 py-4 text-zinc-950 text-right">{formatCurrency(item.inventoryValue, currencyCode)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      item.status === "Healthy" ? "bg-[#F0FFF4] text-emerald-600" :
                      item.status === "Low" ? "bg-[#FFF9F0] text-amber-500" :
                      item.status === "Critical" ? "bg-[#FFF5F5] text-rose-600" :
                      "bg-zinc-50 text-zinc-950"
                    }`}>
                      {item.status === "Healthy" && <CheckCircle size={12} />}
                      {(item.status === "Low" || item.status === "Critical") && <AlertCircle size={12} />}
                      {item.status === "Out of stock" && <AlertTriangle size={12} />}
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
