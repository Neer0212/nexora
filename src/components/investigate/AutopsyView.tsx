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
import type { IndustryConfig } from "@/lib/industries"

type AutopsyData = {
  businessName: string
  currencyCode: string
  industryConfig: IndustryConfig
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
  const { comparison, orderMetrics, inventoryMetrics, currencyCode, industryConfig } = props
  const revDown = comparison.revenueChange !== null && comparison.revenueChange < 0
  const t = industryConfig.terminology

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
            <h1 className="text-3xl font-light text-zinc-950 tracking-tight">Business Autopsy</h1>
            <p className="text-zinc-500 mt-2">Health summary and root-cause analysis for {props.businessName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium font-semibold text-blue-600">Data Freshness</p>
            <p className="text-sm text-zinc-950 mt-1">{props.latestDate || "No dates detected"}</p>
            <p className="text-xs text-zinc-500 mt-1">Sources: {props.datasets.join(", ") || "None"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border border-zinc-200 rounded-xl overflow-hidden divide-y md:divide-y-0 md:divide-x divide-zinc-200 shadow-sm bg-white">
        <div className="p-6">
          <p className="text-xs font-medium text-blue-600 mb-2 flex items-center gap-2"><Activity size={14} /> Total {t.revenueLabel}</p>
          <p className="text-3xl font-light text-zinc-950">{formatCurrency(orderMetrics.revenue, currencyCode)}</p>
        </div>
        <div className="p-6">
          <p className="text-xs font-medium text-blue-600 mb-2 flex items-center gap-2"><Store size={14} /> Total {t.ordersLabel}</p>
          <p className="text-3xl font-light text-zinc-950">{orderMetrics.orders}</p>
        </div>
        <div className="p-6">
          <p className="text-xs font-medium text-blue-600 mb-2 flex items-center gap-2"><Users size={14} /> {t.customersLabel}</p>
          <p className="text-3xl font-light text-zinc-950">{props.customerCount}</p>
        </div>
        <div className="p-6 border-t md:border-t-0 lg:border-t border-zinc-200">
          <p className="text-xs font-medium text-blue-600 mb-2">{t.averageOrderValueLabel}</p>
          <p className="text-3xl font-light text-zinc-950">{formatCurrency(orderMetrics.averageOrderValue, currencyCode)}</p>
        </div>
        <div className="p-6 border-t border-zinc-200">
          <p className="text-xs font-medium text-blue-600 mb-2 flex items-center gap-2"><RefreshCcw size={14} /> Returns</p>
          <p className="text-3xl font-light text-zinc-950">{orderMetrics.returns}</p>
        </div>
        <div className="p-6 border-t border-zinc-200">
          <p className="text-xs font-medium text-blue-600 mb-2 flex items-center gap-2"><PackageSearch size={14} /> {t.inventory.singular} Value</p>
          <p className="text-3xl font-light text-zinc-950">{formatCurrency(inventoryMetrics.totalValue, currencyCode)}</p>
        </div>
      </div>

      {/* Period Comparison Panel */}
      <div className="bg-white p-8 rounded-xl border border-zinc-200 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-medium text-zinc-950">Period Comparison</h2>
          <p className="text-sm text-zinc-500 mt-1">Current 30-day vs Previous 30-day</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="text-sm text-zinc-500 mb-1">Revenue</p>
            <div className="flex items-end gap-3">
              <p className="text-2xl text-zinc-950">{formatCurrency(comparison.currentRevenue, currencyCode)}</p>
              <span className={`text-sm mb-1 px-2 py-0.5 rounded-full ${comparison.revenueChange && comparison.revenueChange > 0 ? "text-emerald-600 bg-[#F0FFF4]" : comparison.revenueChange && comparison.revenueChange < 0 ? "text-rose-600 bg-[#FFF5F5]" : "text-zinc-500 bg-zinc-50"}`}>
                {formatChange(comparison.revenueChange)}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-zinc-500 mb-1">Orders</p>
            <div className="flex items-end gap-3">
              <p className="text-2xl text-zinc-950">{comparison.currentOrders}</p>
              <span className={`text-sm mb-1 px-2 py-0.5 rounded-full ${comparison.ordersChange && comparison.ordersChange > 0 ? "text-emerald-600 bg-[#F0FFF4]" : comparison.ordersChange && comparison.ordersChange < 0 ? "text-rose-600 bg-[#FFF5F5]" : "text-zinc-500 bg-zinc-50"}`}>
                {formatChange(comparison.ordersChange)}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-zinc-500 mb-1">AOV</p>
            <div className="flex items-end gap-3">
              <p className="text-2xl text-zinc-950">{formatCurrency(comparison.currentAOV, currencyCode)}</p>
              <span className={`text-sm mb-1 px-2 py-0.5 rounded-full ${comparison.aovChange && comparison.aovChange > 0 ? "text-emerald-600 bg-[#F0FFF4]" : comparison.aovChange && comparison.aovChange < 0 ? "text-rose-600 bg-[#FFF5F5]" : "text-zinc-500 bg-zinc-50"}`}>
                {formatChange(comparison.aovChange)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Root-Cause Tree */}
      {revDown && (
        <div className="bg-white p-8 rounded-xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-2 mb-8">
            <AlertTriangle className="text-rose-600" size={20} />
            <h2 className="text-xl font-medium text-zinc-950">Root-Cause Tree</h2>
          </div>
          <div className="ml-4 pl-4 border-l-2 border-zinc-200 space-y-6 relative">
            <div className="relative">
              <div className="absolute -left-[1.6rem] top-4 w-6 border-b-2 border-zinc-200"></div>
              <div className="bg-[#FFF5F5] p-4 rounded-xl border border-[#FEE2E2]">
                <p className="text-lg text-rose-600 font-medium">Revenue {formatChange(comparison.revenueChange)}</p>
                <p className="text-sm text-rose-600/80 mt-1">Primary signal</p>
              </div>
            </div>

            <div className="ml-8 pl-4 border-l-2 border-zinc-200 space-y-6">
              <div className="relative">
                <div className="absolute -left-[1.6rem] top-4 w-6 border-b-2 border-zinc-200"></div>
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                  <p className="text-zinc-950 font-medium">Orders {formatChange(comparison.ordersChange)}</p>
                  <p className="text-sm text-zinc-500 mt-1">Associated with volume drop</p>
                </div>
              </div>

              {props.topProducts.length > 0 && (
                <div className="relative">
                  <div className="absolute -left-[1.6rem] top-4 w-6 border-b-2 border-zinc-200"></div>
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                    <p className="text-zinc-950 font-medium">Top Product: {props.topProducts[0].name}</p>
                    <p className="text-sm text-zinc-500 mt-1">Largest contributor, worth investigating</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/entities" className="bg-zinc-50 p-4 rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-between group">
          <span className="text-zinc-950 font-medium">Entity Intel</span>
          <ArrowRight size={16} className="text-blue-600 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link href="/inventory" className="bg-zinc-50 p-4 rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-between group">
          <span className="text-zinc-950 font-medium">Inventory</span>
          <ArrowRight size={16} className="text-blue-600 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link href="/suppliers" className="bg-zinc-50 p-4 rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-between group">
          <span className="text-zinc-950 font-medium">Suppliers</span>
          <ArrowRight size={16} className="text-blue-600 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link href="/changes" className="bg-zinc-50 p-4 rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-between group">
          <span className="text-zinc-950 font-medium">What Changed</span>
          <ArrowRight size={16} className="text-blue-600 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  )
}
