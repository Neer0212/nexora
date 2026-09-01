"use client"

import React from "react"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, ArrowDownRight, Activity, TrendingUp, AlertCircle } from "lucide-react"
import type { ChangeItem, ProductItem, CustomerItem } from "@/lib/business-metrics"
import { formatCurrency, formatChange } from "@/lib/data-utils"

type ChangesData = {
  businessName: string
  currencyCode: string
  latestDate: string | null
  datasets: string[]
  changes: ChangeItem[]
  topProductChanges: ProductItem[]
  topCustomerChanges: CustomerItem[]
}

export default function ChangesView({ data }: { data: ChangesData }) {
  if (data.datasets.length === 0 || data.changes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)] text-center">
        <Activity className="w-16 h-16 text-[#C8ACD6] mb-6" />
        <h2 className="text-2xl font-semibold text-[#17153B] mb-2">Connect order data to see what changed</h2>
        <p className="text-[#68647A] mb-8 text-center max-w-md">
          Track period-over-period changes in revenue, orders, and key metrics.
        </p>
        <Link href="/data-hub" className="px-6 py-3 bg-[#17153B] text-white rounded-xl hover:bg-[#2E236C] transition-colors inline-flex items-center gap-2 font-medium">
          Connect Data <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  const { changes, topProductChanges, topCustomerChanges, currencyCode } = data

  return (
    <div className="space-y-10">
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-[#17153B] tracking-tight mb-2">WHAT CHANGED</h2>
        <p className="text-[#68647A] text-lg">Period-over-period variance analysis across your business</p>
      </div>

      {/* Metric Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {changes.map((change, idx) => {
          const isPositive = (change.changePercent ?? 0) > 0
          const isNegative = (change.changePercent ?? 0) < 0

          const isCurrency = ["Revenue", "Average Order Value", "Inventory Value"].includes(change.metric)
          const currentVal = isCurrency ? formatCurrency(change.currentValue, currencyCode) : change.currentValue.toLocaleString()

          return (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)] flex flex-col justify-between">
              <div>
                <h3 className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B] mb-4">{change.metric}</h3>
                <div className="text-3xl font-semibold text-[#17153B] mb-2">{currentVal}</div>
                <div className={`flex items-center gap-1 font-medium ${isPositive ? "text-[#3C8F70]" : isNegative ? "text-[#B85454]" : "text-[#68647A]"}`}>
                  {isPositive ? <ArrowUpRight className="w-4 h-4" /> : isNegative ? <ArrowDownRight className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  <span>{formatChange(change.changePercent)}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E7E4EF]">
                <p className="text-xs text-[#68647A] mb-3">{change.evidence || "No particular drivers detected."}</p>
                <Link href={change.domain === "inventory" ? "/inventory" : change.domain === "suppliers" ? "/suppliers" : "/autopsy"} className="text-xs font-semibold text-[#433D8B] hover:text-[#2E236C] inline-flex items-center gap-1 transition-colors">
                  Investigate <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Largest Product Revenue Contributors */}
        <div className="bg-white rounded-2xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)] overflow-hidden">
          <div className="p-6 border-b border-[#E7E4EF] flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#17153B]">Top Revenue Products</h3>
            <TrendingUp className="w-5 h-5 text-[#68647A]" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F1F0F8] border-b border-[#E7E4EF]">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">Product Name</th>
                  <th className="px-6 py-4 text-right text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">Revenue</th>
                  <th className="px-6 py-4 text-right text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E4EF]">
                {topProductChanges.length > 0 ? topProductChanges.map((prod, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#17153B]">{prod.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-[#17153B]">
                      {formatCurrency(prod.revenue, currencyCode)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#68647A]">{prod.share.toFixed(1)}%</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-[#68647A] text-sm">No product data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Largest Customer Revenue Contributors */}
        <div className="bg-white rounded-2xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)] overflow-hidden">
          <div className="p-6 border-b border-[#E7E4EF] flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#17153B]">Top Revenue Customers</h3>
            <AlertCircle className="w-5 h-5 text-[#68647A]" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F1F0F8] border-b border-[#E7E4EF]">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">Customer Name</th>
                  <th className="px-6 py-4 text-right text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">Revenue</th>
                  <th className="px-6 py-4 text-right text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B]">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E4EF]">
                {topCustomerChanges.length > 0 ? topCustomerChanges.map((cust, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#17153B]">{cust.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-[#17153B]">
                      {formatCurrency(cust.revenue, currencyCode)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#68647A]">{cust.share.toFixed(1)}%</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-[#68647A] text-sm">No customer data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
