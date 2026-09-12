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
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-zinc-200 shadow-sm text-center">
        <Activity className="w-16 h-16 text-blue-200 mb-6" />
        <h2 className="text-2xl font-semibold text-zinc-950 mb-2">Connect order data to see what changed</h2>
        <p className="text-zinc-500 mb-8 text-center max-w-md">
          Track period-over-period changes in revenue, orders, and key metrics.
        </p>
        <Link href="/data-hub" className="px-6 py-3 bg-zinc-950 text-white rounded-xl hover:bg-blue-800 transition-colors inline-flex items-center gap-2 font-medium">
          Connect Data <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  const { changes, topProductChanges, topCustomerChanges, currencyCode } = data

  return (
    <div className="space-y-10">
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-zinc-950 tracking-tight mb-2">WHAT CHANGED</h2>
        <p className="text-zinc-500 text-lg">Period-over-period variance analysis across your business</p>
      </div>

      {/* Metric Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {changes.map((change, idx) => {
          const isPositive = (change.changePercent ?? 0) > 0
          const isNegative = (change.changePercent ?? 0) < 0

          const isCurrency = ["Revenue", "Average Order Value", "Inventory Value"].includes(change.metric)
          const currentVal = isCurrency ? formatCurrency(change.currentValue, currencyCode) : change.currentValue.toLocaleString()

          return (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-medium font-semibold text-blue-600 mb-4">{change.metric}</h3>
                <div className="text-3xl font-semibold text-zinc-950 mb-2">{currentVal}</div>
                <div className={`flex items-center gap-1 font-medium ${isPositive ? "text-emerald-600" : isNegative ? "text-rose-600" : "text-zinc-500"}`}>
                  {isPositive ? <ArrowUpRight className="w-4 h-4" /> : isNegative ? <ArrowDownRight className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  <span>{formatChange(change.changePercent)}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-200">
                <p className="text-xs text-zinc-500 mb-3">{change.evidence || "No particular drivers detected."}</p>
                <Link href={change.domain === "inventory" ? "/inventory" : change.domain === "suppliers" ? "/suppliers" : "/autopsy"} className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 transition-colors">
                  Investigate <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Largest Product Revenue Contributors */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-zinc-950">Top Revenue Products</h3>
            <TrendingUp className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium font-semibold text-blue-600">Product Name</th>
                  <th className="px-6 py-4 text-right text-xs font-medium font-semibold text-blue-600">Revenue</th>
                  <th className="px-6 py-4 text-right text-xs font-medium font-semibold text-blue-600">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {topProductChanges.length > 0 ? topProductChanges.map((prod, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-950">{prod.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-zinc-950">
                      {formatCurrency(prod.revenue, currencyCode)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-zinc-500">{prod.share.toFixed(1)}%</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-zinc-500 text-sm">No product data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Largest Customer Revenue Contributors */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-zinc-950">Top Revenue Customers</h3>
            <AlertCircle className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium font-semibold text-blue-600">Customer Name</th>
                  <th className="px-6 py-4 text-right text-xs font-medium font-semibold text-blue-600">Revenue</th>
                  <th className="px-6 py-4 text-right text-xs font-medium font-semibold text-blue-600">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {topCustomerChanges.length > 0 ? topCustomerChanges.map((cust, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-950">{cust.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-zinc-950">
                      {formatCurrency(cust.revenue, currencyCode)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-zinc-500">{cust.share.toFixed(1)}%</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-zinc-500 text-sm">No customer data available</td>
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
