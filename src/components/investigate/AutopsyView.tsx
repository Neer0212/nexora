"use client"

import Link from "next/link"
import Breadcrumbs from "@/components/layout/Breadcrumbs"
import { formatCurrency, formatChange } from "@/lib/data-utils"
import {
  Activity,
  ArrowRight,
  PackageSearch,
  Users,
  Store,
  RefreshCcw,
  AlertTriangle
} from "lucide-react"

type AutopsyData = {
  businessName: string
  currencyCode: string
  latestDate: string | null
  datasets: string[]
  comparison: {
    currentRevenue: number
    previousRevenue: number
    revenueChange: number | null
    currentOrders: number
    previousOrders: number
    ordersChange: number | null
    currentAOV: number
    previousAOV: number
    aovChange: number | null
  }
  orderMetrics: {
    revenue: number
    orders: number
    units: number
    averageOrderValue: number
    returns: number
  }
  inventoryMetrics: {
    totalValue: number
    lowStockCount: number
    outOfStockCount: number
  }
  supplierMetrics: {
    count: number
    riskyCount: number
  }
  customerCount: number
  topProducts: Array<{ name: string; revenue: number; share: number }>
  topCustomers: Array<{ name: string; revenue: number; share: number }>
}

export default function AutopsyView(props: AutopsyData) {
  const { comparison, orderMetrics, inventoryMetrics, currencyCode } = props
  const revDown = comparison.revenueChange !== null && comparison.revenueChange < 0

  return (
    <div className="max-w-[1500px] mx-auto p-8 space-y-12">
      {/* Header */}
      <div>
        <Breadcrumbs items={[
          { label: "Investigate", href: "/investigate" },
          { label: "Business Autopsy", href: "/autopsy" }
        ]} />
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-[#17153B] tracking-tight">Business Autopsy</h1>
            <p className="text-[#68647A] mt-2">Health summary and root-cause analysis for {props.businessName}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">Data Freshness</p>
            <p className="text-sm text-[#17153B] mt-1">{props.latestDate || "No dates detected"}</p>
            <p className="text-xs text-[#68647A] mt-1">Sources: {props.datasets.join(", ") || "None"}</p>
          </div>
        </div>
      </div>

      {/* Health Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B] mb-2 flex items-center gap-2"><Activity size={14} /> Total Revenue</p>
          <p className="text-3xl font-light text-[#17153B]">{formatCurrency(orderMetrics.revenue, currencyCode)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B] mb-2 flex items-center gap-2"><Store size={14} /> Total Orders</p>
          <p className="text-3xl font-light text-[#17153B]">{orderMetrics.orders}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B] mb-2 flex items-center gap-2"><Users size={14} /> Customers</p>
          <p className="text-3xl font-light text-[#17153B]">{props.customerCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B] mb-2">AOV</p>
          <p className="text-3xl font-light text-[#17153B]">{formatCurrency(orderMetrics.averageOrderValue, currencyCode)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B] mb-2 flex items-center gap-2"><RefreshCcw size={14} /> Returns</p>
          <p className="text-3xl font-light text-[#17153B]">{orderMetrics.returns}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B] mb-2 flex items-center gap-2"><PackageSearch size={14} /> Inventory Value</p>
          <p className="text-3xl font-light text-[#17153B]">{formatCurrency(inventoryMetrics.totalValue, currencyCode)}</p>
        </div>
      </div>

      {/* Period Comparison Panel */}
      <div className="bg-white p-8 rounded-3xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)] space-y-6">
        <div>
          <h2 className="text-xl font-medium text-[#17153B]">Period Comparison</h2>
          <p className="text-sm text-[#68647A] mt-1">Current 30-day vs Previous 30-day</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="text-sm text-[#68647A] mb-1">Revenue</p>
            <div className="flex items-end gap-3">
              <p className="text-2xl text-[#17153B]">{formatCurrency(comparison.currentRevenue, currencyCode)}</p>
              <span className={`text-sm mb-1 px-2 py-0.5 rounded-full ${comparison.revenueChange && comparison.revenueChange > 0 ? "text-[#3C8F70] bg-[#F0FFF4]" : comparison.revenueChange && comparison.revenueChange < 0 ? "text-[#B85454] bg-[#FFF5F5]" : "text-[#68647A] bg-[#F1F0F8]"}`}>
                {formatChange(comparison.revenueChange)}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-[#68647A] mb-1">Orders</p>
            <div className="flex items-end gap-3">
              <p className="text-2xl text-[#17153B]">{comparison.currentOrders}</p>
              <span className={`text-sm mb-1 px-2 py-0.5 rounded-full ${comparison.ordersChange && comparison.ordersChange > 0 ? "text-[#3C8F70] bg-[#F0FFF4]" : comparison.ordersChange && comparison.ordersChange < 0 ? "text-[#B85454] bg-[#FFF5F5]" : "text-[#68647A] bg-[#F1F0F8]"}`}>
                {formatChange(comparison.ordersChange)}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-[#68647A] mb-1">AOV</p>
            <div className="flex items-end gap-3">
              <p className="text-2xl text-[#17153B]">{formatCurrency(comparison.currentAOV, currencyCode)}</p>
              <span className={`text-sm mb-1 px-2 py-0.5 rounded-full ${comparison.aovChange && comparison.aovChange > 0 ? "text-[#3C8F70] bg-[#F0FFF4]" : comparison.aovChange && comparison.aovChange < 0 ? "text-[#B85454] bg-[#FFF5F5]" : "text-[#68647A] bg-[#F1F0F8]"}`}>
                {formatChange(comparison.aovChange)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Root-Cause Tree */}
      {revDown && (
        <div className="bg-white p-8 rounded-3xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <div className="flex items-center gap-2 mb-8">
            <AlertTriangle className="text-[#B85454]" size={20} />
            <h2 className="text-xl font-medium text-[#17153B]">Root-Cause Tree</h2>
          </div>
          <div className="ml-4 pl-4 border-l-2 border-[#E7E4EF] space-y-6 relative">
            <div className="relative">
              <div className="absolute -left-[1.6rem] top-4 w-6 border-b-2 border-[#E7E4EF]"></div>
              <div className="bg-[#FFF5F5] p-4 rounded-xl border border-[#FEE2E2]">
                <p className="text-lg text-[#B85454] font-medium">Revenue {formatChange(comparison.revenueChange)}</p>
                <p className="text-sm text-[#B85454]/80 mt-1">Primary signal</p>
              </div>
            </div>

            <div className="ml-8 pl-4 border-l-2 border-[#E7E4EF] space-y-6">
              <div className="relative">
                <div className="absolute -left-[1.6rem] top-4 w-6 border-b-2 border-[#E7E4EF]"></div>
                <div className="bg-[#F1F0F8] p-4 rounded-xl border border-[#E7E4EF]">
                  <p className="text-[#17153B] font-medium">Orders {formatChange(comparison.ordersChange)}</p>
                  <p className="text-sm text-[#68647A] mt-1">Associated with volume drop</p>
                </div>
              </div>

              {props.topProducts.length > 0 && (
                <div className="relative">
                  <div className="absolute -left-[1.6rem] top-4 w-6 border-b-2 border-[#E7E4EF]"></div>
                  <div className="bg-[#F1F0F8] p-4 rounded-xl border border-[#E7E4EF]">
                    <p className="text-[#17153B] font-medium">Top Product: {props.topProducts[0].name}</p>
                    <p className="text-sm text-[#68647A] mt-1">Largest contributor, worth investigating</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/entities" className="bg-[#F1F0F8] p-4 rounded-xl hover:bg-[#E7E4EF] transition-colors flex items-center justify-between group">
          <span className="text-[#17153B] font-medium">Entity Intel</span>
          <ArrowRight size={16} className="text-[#433D8B] group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link href="/inventory" className="bg-[#F1F0F8] p-4 rounded-xl hover:bg-[#E7E4EF] transition-colors flex items-center justify-between group">
          <span className="text-[#17153B] font-medium">Inventory</span>
          <ArrowRight size={16} className="text-[#433D8B] group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link href="/suppliers" className="bg-[#F1F0F8] p-4 rounded-xl hover:bg-[#E7E4EF] transition-colors flex items-center justify-between group">
          <span className="text-[#17153B] font-medium">Suppliers</span>
          <ArrowRight size={16} className="text-[#433D8B] group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link href="/changes" className="bg-[#F1F0F8] p-4 rounded-xl hover:bg-[#E7E4EF] transition-colors flex items-center justify-between group">
          <span className="text-[#17153B] font-medium">What Changed</span>
          <ArrowRight size={16} className="text-[#433D8B] group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  )
}
