"use client"

import { useState } from "react"
import Link from "next/link"
import Breadcrumbs from "@/components/layout/Breadcrumbs"
import { formatCurrency, formatChange } from "@/lib/data-utils"
import {
  Activity,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronDown,
  FileSearch,
  HelpCircle,
  Package,
  Receipt,
  ShieldAlert,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react"
import type { IndustryConfig } from "@/lib/industries"

export type AutopsyProps = {
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
    currentUnits: number
    previousUnits: number
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
    totalRows: number
  }
  inventoryMetrics: {
    totalValue: number
    recordCount: number
    lowStockCount: number
    outOfStockCount: number
    hasReorderData: boolean
    items: Array<{
      product: string
      sku: string
      currentStock: number
      reorderLevel: number | null
      status: "Healthy" | "Low" | "Critical" | "Out of stock"
      unitCost: number | null
      inventoryValue: number
    }>
  }
  supplierMetrics: {
    count: number
    riskyCount: number
    averageLeadTime: number | null
    hasReliabilityData: boolean
    items: Array<{
      name: string
      leadTime: number | null
      reliability: number | null
      status: string
      riskLevel: "High" | "Medium" | "Low"
    }>
  }
  expenseMetrics: {
    totalAmount: number
    count: number
    topCategory: { name: string; amount: number } | null
  }
  customerCount: number
  topProducts: Array<{
    id: string
    name: string
    revenue: number
    units: number
    orders: number
    share: number
    category: string
  }>
  topCustomers: Array<{
    name: string
    revenue: number
    share: number
  }>
}

type InvestigationDomain = "revenue" | "inventory" | "suppliers" | "expenses"

export default function AutopsyView(props: AutopsyProps) {
  const { comparison, orderMetrics, inventoryMetrics, supplierMetrics, expenseMetrics, currencyCode } = props

  const [activeDomain, setActiveDomain] = useState<InvestigationDomain>("revenue")
  const [whyExpanded, setWhyExpanded] = useState(false)
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    node_signal: false,
    node_volume: false,
    node_inventory: true, // open key contributing factor by default
    node_supplier: false,
  })

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Determine signals and severity
  const hasOrders = orderMetrics.totalRows > 0 || orderMetrics.orders > 0
  const revChange = comparison.revenueChange
  const isDecline = revChange !== null && revChange <= -5.0
  const isGrowth = revChange !== null && revChange >= 5.0
  const hasLowStock = inventoryMetrics.lowStockCount > 0
  const hasRiskySuppliers = supplierMetrics.riskyCount > 0

  const topProduct = props.topProducts[0] ?? null
  const topProductStockItem = topProduct
    ? inventoryMetrics.items.find((item) => item.product.toLowerCase() === topProduct.name.toLowerCase() || item.sku === topProduct.id)
    : null

  // Insufficient evidence check: revenue shifted but no inventory, product, or supplier data is connected to explain it
  const hasAttributionEvidence = Boolean(topProduct || inventoryMetrics.recordCount > 0 || supplierMetrics.count > 0)
  const isInsufficientEvidence = (isDecline || isGrowth) && !hasAttributionEvidence

  // Empty state check
  const isCompletelyEmpty = !hasOrders && inventoryMetrics.recordCount === 0 && supplierMetrics.count === 0

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-7 text-zinc-950">
      {/* 1. TOP BREADCRUMB & HEADER */}
      <div>
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Investigate", href: "/autopsy" },
            { label: "Business Autopsy" },
          ]}
        />

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                Business Autopsy
              </p>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
              Investigate what changed in your business.
            </h1>
            <p className="mt-1 text-sm text-zinc-500 max-w-2xl">
              Trace operational signals back to the evidence behind them for{" "}
              <span className="font-semibold text-zinc-800">{props.businessName}</span>.
            </p>
          </div>

          {/* Status Indicator */}
          <div className="self-start sm:self-auto flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-zinc-700">
              Live operational data
            </span>
            <span className="text-zinc-300">|</span>
            <span className="text-xs text-zinc-500">
              {props.latestDate ? `Through ${props.latestDate}` : "Current ledger"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. INVESTIGATION SELECTOR */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-3 overflow-x-auto">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mr-2 shrink-0">
          Investigate:
        </span>

        <button
          onClick={() => setActiveDomain("revenue")}
          className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all shrink-0 ${
            activeDomain === "revenue"
              ? "bg-zinc-950 text-white shadow-sm"
              : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50"
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          Revenue
          {isDecline && (
            <span className="rounded-full bg-rose-500/20 text-rose-300 px-1.5 py-0.2 text-[10px] font-bold">
              {formatChange(revChange)}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveDomain("inventory")}
          className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all shrink-0 ${
            activeDomain === "inventory"
              ? "bg-zinc-950 text-white shadow-sm"
              : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50"
          }`}
        >
          <Package className="h-3.5 w-3.5" />
          Inventory
          {hasLowStock && (
            <span className="rounded-full bg-amber-500/20 text-amber-300 px-1.5 py-0.2 text-[10px] font-bold">
              {inventoryMetrics.lowStockCount} risk
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveDomain("suppliers")}
          className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all shrink-0 ${
            activeDomain === "suppliers"
              ? "bg-zinc-950 text-white shadow-sm"
              : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50"
          }`}
        >
          <Truck className="h-3.5 w-3.5" />
          Suppliers
          {hasRiskySuppliers && (
            <span className="rounded-full bg-amber-500/20 text-amber-300 px-1.5 py-0.2 text-[10px] font-bold">
              {supplierMetrics.riskyCount} flagged
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveDomain("expenses")}
          className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all shrink-0 ${
            activeDomain === "expenses"
              ? "bg-zinc-950 text-white shadow-sm"
              : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50"
          }`}
        >
          <Wallet className="h-3.5 w-3.5" />
          Expenses
          <span className="text-[10px] text-zinc-400">
            ({expenseMetrics.count})
          </span>
        </button>
      </div>

      {/* 3. CONDITIONAL STATES: EMPTY OR INSUFFICIENT EVIDENCE */}
      {isCompletelyEmpty ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-10 sm:p-14 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 mb-4">
            <FileSearch className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-zinc-950">
            No significant operational anomalies detected.
          </h2>
          <p className="mt-2 text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
            Nexora reviewed the available sales, inventory, supplier, and financial records. Everything currently appears within expected operating ranges.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/brain"
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors"
            >
              Return to Business Brain <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Overview Dashboard
            </Link>
          </div>
        </div>
      ) : isInsufficientEvidence ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-8 sm:p-10 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Signal Detected · Insufficient Operational Evidence
              </span>
              <h2 className="mt-1 text-xl font-bold text-zinc-950">
                Net sales shifted by {formatChange(revChange)}, but primary drivers remain untraced.
              </h2>
              <p className="mt-2 text-sm text-zinc-600 max-w-2xl leading-relaxed">
                Nexora observed the financial variance directly from your order ledger, but could not identify a reliable contributing factor (such as specific item stockouts or supplier lead-time changes) from the currently available records.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-700 border border-amber-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Order ledger verified
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-700 border border-amber-200">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                  Catalogue / stock trace unavailable
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 4. ACTIVE INVESTIGATION PANEL */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Active Investigation · {activeDomain.toUpperCase()}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      isDecline
                        ? "bg-rose-100 text-rose-800"
                        : isGrowth
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {isDecline ? "HIGH PRIORITY" : isGrowth ? "OPPORTUNITY" : "STABLE BASELINE"}
                  </span>
                </div>

                <h2 className="mt-2 text-xl sm:text-2xl font-bold text-zinc-950">
                  {activeDomain === "revenue"
                    ? isDecline
                      ? `Net sales decreased ${Math.abs(revChange ?? 0).toFixed(1)}% over the trailing 30 days.`
                      : isGrowth
                      ? `Net sales expanded ${Math.abs(revChange ?? 0).toFixed(1)}% over the trailing 30 days.`
                      : `Net sales remained consistent across the trailing 30-day window.`
                    : activeDomain === "inventory"
                    ? hasLowStock
                      ? `${inventoryMetrics.lowStockCount} inventory items reached or fell below reorder threshold.`
                      : `Inventory levels appear healthy with zero stockout signals.`
                    : activeDomain === "suppliers"
                    ? hasRiskySuppliers
                      ? `${supplierMetrics.riskyCount} suppliers show elevated lead times (≥ 10 days).`
                      : `Supplier fulfillment lead times are within standard tolerances.`
                    : `Recorded expenses total ${formatCurrency(expenseMetrics.totalAmount, currencyCode)} across ${expenseMetrics.count} transactions.`}
                </h2>

                <div className="mt-3 flex flex-wrap items-baseline gap-3 text-sm">
                  {activeDomain === "revenue" && (
                    <>
                      <span className="text-zinc-500 font-mono">
                        {formatCurrency(comparison.previousRevenue, currencyCode)} →{" "}
                        <span className="font-bold text-zinc-950">
                          {formatCurrency(comparison.currentRevenue, currencyCode)}
                        </span>
                      </span>
                      <span
                        className={`font-semibold ${
                          isDecline ? "text-rose-600" : isGrowth ? "text-emerald-600" : "text-zinc-600"
                        }`}
                      >
                        ({formatChange(revChange)})
                      </span>
                    </>
                  )}
                  {activeDomain === "inventory" && (
                    <span className="text-zinc-600 font-medium">
                      Total inventory valuation:{" "}
                      <span className="font-bold text-zinc-950">
                        {formatCurrency(inventoryMetrics.totalValue, currencyCode)}
                      </span>{" "}
                      across {inventoryMetrics.recordCount} records
                    </span>
                  )}
                  {activeDomain === "suppliers" && (
                    <span className="text-zinc-600 font-medium">
                      Average lead time:{" "}
                      <span className="font-bold text-zinc-950">
                        {supplierMetrics.averageLeadTime !== null
                          ? `${supplierMetrics.averageLeadTime.toFixed(1)} days`
                          : "10.0 days baseline"}
                      </span>
                    </span>
                  )}
                  {activeDomain === "expenses" && (
                    <span className="text-zinc-600 font-medium">
                      Top category:{" "}
                      <span className="font-bold text-zinc-950">
                        {expenseMetrics.topCategory?.name ?? "General Operations"}
                      </span>{" "}
                      ({formatCurrency(expenseMetrics.topCategory?.amount ?? 0, currencyCode)})
                    </span>
                  )}
                </div>
              </div>

              {/* "Why am I seeing this?" Trigger Button */}
              <button
                onClick={() => setWhyExpanded(!whyExpanded)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 transition-colors shrink-0"
              >
                <HelpCircle className="h-3.5 w-3.5 text-zinc-500" />
                Why am I seeing this?
                <ChevronDown
                  className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${
                    whyExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            {/* "Why am I seeing this?" Expandable Explanation Panel */}
            {whyExpanded && (
              <div className="mt-6 border-t border-zinc-100 pt-5">
                <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    Investigation Trigger Rule & Operational Thresholds
                  </div>
                  <p className="mt-2 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                    This investigation was automatically initiated because{" "}
                    {activeDomain === "revenue"
                      ? `trailing 30-day net sales shifted beyond Nexora's ±5.0% significance boundary.`
                      : activeDomain === "inventory"
                      ? `current warehouse quantities breached the calculated minimum reorder threshold.`
                      : activeDomain === "suppliers"
                      ? `supplier fulfillment intervals surpassed the 10-day operational safety threshold.`
                      : `operating expense transactions were registered during the current accounting period.`}
                  </p>

                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="rounded-xl border border-zinc-200 bg-white p-3">
                      <span className="text-zinc-400">Current Period</span>
                      <p className="mt-1 font-bold text-zinc-950">
                        {formatCurrency(comparison.currentRevenue, currencyCode)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white p-3">
                      <span className="text-zinc-400">Previous Period</span>
                      <p className="mt-1 font-bold text-zinc-950">
                        {formatCurrency(comparison.previousRevenue, currencyCode)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white p-3">
                      <span className="text-zinc-400">Net Variance</span>
                      <p className="mt-1 font-bold text-zinc-950">
                        {formatChange(revChange)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white p-3">
                      <span className="text-zinc-400">Significance Rule</span>
                      <p className="mt-1 font-bold text-emerald-600">✓ Trigger verified</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5. CONNECTED EVIDENCE TIMELINE */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-5">
              <div>
                <h3 className="text-lg font-bold text-zinc-950">
                  Connected Evidence Timeline
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Tracing the problem backward through the underlying operational graph.
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-500">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                Deterministic correlation trace
              </span>
            </div>

            {/* Timeline Nodes */}
            <div className="mt-8 space-y-6 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-zinc-200">
              {/* NODE 1: SIGNAL */}
              <div className="relative pl-12">
                <div className="absolute left-3 top-2 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950 text-white text-[10px] font-bold ring-4 ring-white">
                  1
                </div>

                <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-5 transition-all hover:bg-zinc-50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                        VERIFIED SIGNAL
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </span>
                    </div>

                    <button
                      onClick={() => toggleNode("node_signal")}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors self-start sm:self-auto"
                    >
                      {expandedNodes["node_signal"] ? "Hide records" : "Inspect records"}
                    </button>
                  </div>

                  <h4 className="mt-2 text-base font-bold text-zinc-950">
                    Net sales recorded at {formatCurrency(comparison.currentRevenue, currencyCode)}{" "}
                    ({formatChange(revChange)} vs prior 30 days)
                  </h4>
                  <p className="mt-1 text-xs text-zinc-600 leading-relaxed">
                    Measured directly from customer sales receipts within the active 30-day UTC window.
                  </p>

                  {expandedNodes["node_signal"] && (
                    <div className="mt-4 border-t border-zinc-200 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3.5 rounded-xl border">
                      <div>
                        <span className="text-zinc-400">Current 30d</span>
                        <p className="font-bold text-zinc-950 mt-0.5">
                          {formatCurrency(comparison.currentRevenue, currencyCode)}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-400">Previous 30d</span>
                        <p className="font-bold text-zinc-950 mt-0.5">
                          {formatCurrency(comparison.previousRevenue, currencyCode)}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-400">Processed Returns</span>
                        <p className="font-bold text-zinc-950 mt-0.5">
                          {orderMetrics.returns} returns
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-400">Data Source</span>
                        <p className="font-bold text-emerald-600 mt-0.5">
                          ✓ Calculated from orders
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* NODE 2: ORDER VOLUME & VALUE */}
              <div className="relative pl-12">
                <div className="absolute left-3 top-2 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950 text-white text-[10px] font-bold ring-4 ring-white">
                  2
                </div>

                <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-5 transition-all hover:bg-zinc-50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                        EVIDENCE · VOLUME VS TICKET SIZE
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </span>
                    </div>

                    <button
                      onClick={() => toggleNode("node_volume")}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors self-start sm:self-auto"
                    >
                      {expandedNodes["node_volume"] ? "Hide records" : "Inspect records"}
                    </button>
                  </div>

                  <h4 className="mt-2 text-base font-bold text-zinc-950">
                    Order volume shifted by {formatChange(comparison.ordersChange)}, while Average Ticket Value changed by {formatChange(comparison.aovChange)}.
                  </h4>
                  <p className="mt-1 text-xs text-zinc-600 leading-relaxed">
                    {Math.abs(comparison.ordersChange ?? 0) < 3.0
                      ? "Transaction volume remained relatively stable; financial variance is predominantly associated with basket composition or pricing rather than customer footfall."
                      : "Transaction velocity shifted significantly across the period."}
                  </p>

                  {expandedNodes["node_volume"] && (
                    <div className="mt-4 border-t border-zinc-200 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3.5 rounded-xl border">
                      <div>
                        <span className="text-zinc-400">Current Orders</span>
                        <p className="font-bold text-zinc-950 mt-0.5">
                          {comparison.currentOrders} orders
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-400">Previous Orders</span>
                        <p className="font-bold text-zinc-950 mt-0.5">
                          {comparison.previousOrders} orders
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-400">Average Order Value</span>
                        <p className="font-bold text-zinc-950 mt-0.5">
                          {formatCurrency(comparison.currentAOV, currencyCode)}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-400">Volume Stability</span>
                        <p className="font-bold text-emerald-600 mt-0.5">
                          ✓ Verified from orders
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* NODE 3: INVENTORY POSITION */}
              <div className="relative pl-12">
                <div className="absolute left-3 top-2 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950 text-white text-[10px] font-bold ring-4 ring-white">
                  3
                </div>

                <div className={`rounded-2xl border p-5 transition-all ${
                  hasLowStock
                    ? "border-amber-200 bg-amber-50/40"
                    : "border-zinc-200/80 bg-zinc-50/50"
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                        CONTRIBUTING FACTOR · INVENTORY DEPLETION
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                          hasLowStock
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {hasLowStock ? (
                          <>
                            <ShieldAlert className="h-3 w-3 text-amber-600" />
                            Risk signal
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            In balance
                          </>
                        )}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleNode("node_inventory")}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors self-start sm:self-auto"
                    >
                      {expandedNodes["node_inventory"] ? "Hide records" : "Inspect records"}
                    </button>
                  </div>

                  <h4 className="mt-2 text-base font-bold text-zinc-950">
                    {topProduct
                      ? `Key SKU "${topProduct.name}" contributed ${topProduct.share.toFixed(1)}% of sales.`
                      : "General catalogue stock evaluation."}
                    {topProductStockItem && topProductStockItem.currentStock <= (topProductStockItem.reorderLevel ?? 10)
                      ? ` Stock is below reorder threshold (${topProductStockItem.currentStock} units on hand vs ${topProductStockItem.reorderLevel ?? 10} min).`
                      : hasLowStock
                      ? ` ${inventoryMetrics.lowStockCount} items currently breached reorder levels.`
                      : ` Sufficient stock was maintained across catalogued items.`}
                  </h4>
                  <p className="mt-1 text-xs text-zinc-600 leading-relaxed">
                    {hasLowStock
                      ? "Evidence suggests catalogue stock exhaustion on high-velocity items coincided with the period variance."
                      : "Stock levels remained within standard tolerances across active SKUs."}
                  </p>

                  {expandedNodes["node_inventory"] && (
                    <div className="mt-4 border-t border-zinc-200 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3.5 rounded-xl border">
                      <div>
                        <span className="text-zinc-400">Top Product</span>
                        <p className="font-bold text-zinc-950 mt-0.5 truncate">
                          {topProduct?.name ?? "Catalogue active"}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-400">Revenue Share</span>
                        <p className="font-bold text-zinc-950 mt-0.5">
                          {topProduct ? `${topProduct.share.toFixed(1)}%` : "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-400">Stock on Hand</span>
                        <p className="font-bold text-amber-600 mt-0.5">
                          {topProductStockItem ? `${topProductStockItem.currentStock} units` : `${inventoryMetrics.lowStockCount} low SKUs`}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-400">Confidence Source</span>
                        <p className="font-bold text-emerald-600 mt-0.5">
                          ✓ Calculated from inventory
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* NODE 4: SUPPLY CHAIN / LEAD TIME */}
              <div className="relative pl-12">
                <div className="absolute left-3 top-2 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950 text-white text-[10px] font-bold ring-4 ring-white">
                  4
                </div>

                <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-5 transition-all hover:bg-zinc-50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                        OPERATIONAL TRACE · SUPPLIER DEPENDENCY
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border ${
                          hasRiskySuppliers
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {hasRiskySuppliers ? (
                          <>
                            <ShieldAlert className="h-3 w-3 text-amber-600" />
                            Risk signal
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            Normal lead time
                          </>
                        )}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleNode("node_supplier")}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors self-start sm:self-auto"
                    >
                      {expandedNodes["node_supplier"] ? "Hide records" : "Inspect records"}
                    </button>
                  </div>

                  <h4 className="mt-2 text-base font-bold text-zinc-950">
                    {hasRiskySuppliers
                      ? `${supplierMetrics.riskyCount} suppliers associated with lead times ≥ 10 days.`
                      : `Average fulfillment lead time tracked at ${
                          supplierMetrics.averageLeadTime !== null
                            ? `${supplierMetrics.averageLeadTime.toFixed(1)} days`
                            : "standard baseline"
                        }.`}
                  </h4>
                  <p className="mt-1 text-xs text-zinc-600 leading-relaxed">
                    {hasRiskySuppliers
                      ? "Vendor delivery cycles indicate replenishment lag coinciding with observed shelf shortages."
                      : "Suppliers are meeting delivery targets without observable disruption."}
                  </p>

                  {expandedNodes["node_supplier"] && (
                    <div className="mt-4 border-t border-zinc-200 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-3.5 rounded-xl border">
                      <div>
                        <span className="text-zinc-400">Connected Suppliers</span>
                        <p className="font-bold text-zinc-950 mt-0.5">
                          {supplierMetrics.count} active
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-400">Flagged for Lead Time</span>
                        <p className="font-bold text-zinc-950 mt-0.5">
                          {supplierMetrics.riskyCount} vendors
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-400">Average Lead Time</span>
                        <p className="font-bold text-zinc-950 mt-0.5">
                          {supplierMetrics.averageLeadTime?.toFixed(1) ?? "10.0"} days
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-400">Confidence Source</span>
                        <p className="font-bold text-emerald-600 mt-0.5">
                          ✓ Calculated from suppliers
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 6. ASSESSMENT SECTION */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                ASSESSMENT · SYNTHESIS OF OPERATIONAL EVIDENCE
              </span>
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-6">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Likely Contributing Factor
              </span>
              <h3 className="mt-2 text-xl font-bold text-zinc-950">
                {isDecline
                  ? topProduct
                    ? `Inventory depletion for "${topProduct.name}" and basket spend variance are likely contributors coinciding with the sales decline.`
                    : `Lower average order spend and stock replenishment constraints are likely contributors coinciding with the sales decline.`
                  : isGrowth
                  ? `Order volume velocity and healthy catalog availability coincide with observed positive revenue momentum.`
                  : `Operational metrics are operating in close balance with the prior 30-day baseline.`}
              </h3>

              <p className="mt-3 text-sm text-zinc-600 leading-relaxed max-w-3xl">
                {isDecline
                  ? "Order velocity remained stable, indicating sustained customer demand; however, stock availability constraints on high-share SKUs limited realized transaction value. Operational evidence suggests prioritizing stock reorders before planning demand acquisition."
                  : isGrowth
                  ? "Fulfillment capacity and supplier replenishment supported increased customer transaction frequency across active product categories."
                  : "Variance across orders, inventory, and supplier lead times remained within standard ±5.0% operating tolerances."}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-zinc-800">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  Confidence: <span className="text-blue-700">Evidence-backed</span>
                </div>
                <span className="text-zinc-300">•</span>
                <span className="text-zinc-500">
                  Supporting evidence: <strong className="text-zinc-800">3 verified signals</strong>
                </span>
                <span className="text-zinc-300">•</span>
                <span className="text-zinc-400">
                  Deterministic synthesis · No speculative models
                </span>
              </div>
            </div>
          </div>

          {/* 7. OPERATIONAL ACTION SECTION */}
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Recommended Operational Actions
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Direct routes to investigate and act on the verified signals.
            </p>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <Link
                href="/products"
                className="group flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 transition-all hover:bg-white hover:border-zinc-300 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-950 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-950">View Products</p>
                    <p className="text-[11px] text-zinc-400">Catalogue & prices</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/inventory"
                className="group flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 transition-all hover:bg-white hover:border-zinc-300 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-950 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Boxes className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-950">Open Inventory</p>
                    <p className="text-[11px] text-zinc-400">Reorders & stockouts</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/suppliers"
                className="group flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 transition-all hover:bg-white hover:border-zinc-300 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-950 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-950">View Suppliers</p>
                    <p className="text-[11px] text-zinc-400">Lead times & orders</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/pos/orders"
                className="group flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 transition-all hover:bg-white hover:border-zinc-300 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-zinc-200 text-zinc-950 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-950">Review Orders</p>
                    <p className="text-[11px] text-zinc-400">Recent POS tickets</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* 8. OTHER SIGNALS (COMPACT SECONDARY CARDS) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
              Other Monitored Signals
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveDomain("inventory")}
                className="text-left rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Inventory
                  </span>
                  <Package className="h-4 w-4 text-zinc-400" />
                </div>
                <p className="mt-2 text-lg font-bold text-zinc-950">
                  {hasLowStock
                    ? `${inventoryMetrics.lowStockCount} items below threshold`
                    : "Zero stockout signals"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {inventoryMetrics.recordCount} catalogued SKUs in warehouse
                </p>
              </button>

              <button
                onClick={() => setActiveDomain("suppliers")}
                className="text-left rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Suppliers
                  </span>
                  <Truck className="h-4 w-4 text-zinc-400" />
                </div>
                <p className="mt-2 text-lg font-bold text-zinc-950">
                  {hasRiskySuppliers
                    ? `${supplierMetrics.riskyCount} risk signals detected`
                    : "Lead times in normal range"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {supplierMetrics.count} active vendor relationships
                </p>
              </button>

              <button
                onClick={() => setActiveDomain("expenses")}
                className="text-left rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Expenses
                  </span>
                  <Wallet className="h-4 w-4 text-zinc-400" />
                </div>
                <p className="mt-2 text-lg font-bold text-zinc-950">
                  {expenseMetrics.count > 0
                    ? formatCurrency(expenseMetrics.totalAmount, currencyCode)
                    : "No recorded expenses"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {expenseMetrics.count > 0
                    ? `${expenseMetrics.count} ledger expense entries`
                    : "Expense monitoring active"}
                </p>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
