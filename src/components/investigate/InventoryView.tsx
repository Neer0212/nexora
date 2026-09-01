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
        <Package size={48} className="text-[#C8ACD6] mb-6" />
        <h2 className="text-2xl font-light text-[#17153B] mb-2">No inventory data connected yet</h2>
        <p className="text-[#68647A] mb-8">Connect your inventory datasets to view stock intelligence.</p>
        <Link href="/data-hub" className="bg-[#17153B] text-white px-6 py-3 rounded-xl hover:bg-[#2E236C] transition-colors">
          Go to Data Hub
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-[1500px] mx-auto p-8 space-y-8">
      {/* Header */}
      <div>
        <Breadcrumbs items={[
          { label: "Investigate", href: "/investigate" },
          { label: "Inventory Investigation", href: "/inventory" }
        ]} />
        <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-light text-[#17153B] tracking-tight">Inventory Investigation</h1>
            <p className="text-[#68647A] mt-2">Analyze stock levels and reorder requirements.</p>
          </div>
        </div>
      </div>

      {!metrics.hasReorderData && (
        <div className="bg-[#FFF5F5] border border-[#FEE2E2] rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-[#B85454]" size={20} />
          <p className="text-[#B85454]">Reorder levels not detected in connected data. Statuses are estimated.</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B] mb-2">Total Value</p>
          <p className="text-3xl font-light text-[#17153B]">{formatCurrency(metrics.totalValue, currencyCode)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B] mb-2">Total Records</p>
          <p className="text-3xl font-light text-[#17153B]">{metrics.recordCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B] mb-2">Low Stock</p>
          <p className="text-3xl font-light text-[#C58A3A]">{metrics.lowStockCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B] mb-2">Out of Stock</p>
          <p className="text-3xl font-light text-[#B85454]">{metrics.outOfStockCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F1F0F8] text-[#68647A]">
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
                <tr key={i} className="border-b border-[#E7E4EF] hover:bg-[#F1F0F8] transition-colors">
                  <td className="px-6 py-4 text-[#17153B] font-medium">{item.product}</td>
                  <td className="px-6 py-4 text-[#68647A]">{item.sku || "—"}</td>
                  <td className="px-6 py-4 text-[#17153B] text-right font-medium">{item.currentStock}</td>
                  <td className="px-6 py-4 text-[#68647A] text-right">{item.reorderLevel ?? "—"}</td>
                  <td className="px-6 py-4 text-[#17153B] text-right">{formatCurrency(item.inventoryValue, currencyCode)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      item.status === "Healthy" ? "bg-[#F0FFF4] text-[#3C8F70]" :
                      item.status === "Low" ? "bg-[#FFF9F0] text-[#C58A3A]" :
                      item.status === "Critical" ? "bg-[#FFF5F5] text-[#B85454]" :
                      "bg-[#F1F0F8] text-[#17153B]"
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
