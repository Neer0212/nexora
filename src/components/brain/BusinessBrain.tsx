"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Breadcrumbs from "@/components/layout/Breadcrumbs"
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Database,
  Package,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Truck,
} from "lucide-react"

type LowStockItem = {
  productId: string
  productName: string
  quantity: number
  reorderLevel: number
}

type TopProduct = {
  id: string
  name: string
  category: string | null
  revenue: number
  quantity: number
  lowStock: boolean
}

type SupplierRisk = {
  id: string
  name: string
  reliability: number | null
  leadTime: number | null
  riskScore: number
}

type EventItem = {
  id: string
  title: string
  description: string | null
  severity: string | null
  occurredAt: string
}

type Recommendation = {
  id: string
  title: string
  reason: string | null
  evidence: unknown
  impact: unknown
  confidence: number
  createdAt: string
}

type BrainData = {
  businessName: string
  currencyCode: string
  currentRevenue: number
  previousRevenue: number
  revenueChange: number | null
  currentOrdersCount: number
  previousOrdersCount: number
  averageOrderValue: number
  inventoryValue: number
  inventoryCount: number
  lowStock: LowStockItem[]
  topProducts: TopProduct[]
  supplierRisks: SupplierRisk[]
  suppliersCount: number
  datasetsCount: number
  readyDatasetsCount: number
  connectedSignals: number
  events: EventItem[]
  recommendations: Recommendation[]
}

type Insight = {
  id: string
  category: "performance" | "risk" | "opportunity" | "context"
  title: string
  summary: string
  detail: string
  icon: typeof TrendingUp
  priority: "high" | "medium" | "low"
  evidence: string[]
  href?: string
}

const tabs = [
  { id: "all", label: "All signals" },
  { id: "performance", label: "Performance" },
  { id: "risk", label: "Risks" },
  { id: "opportunity", label: "Opportunities" },
] as const

type TabId = (typeof tabs)[number]["id"]

function formatCurrency(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currency} ${Math.round(value).toLocaleString("en-IN")}`
  }
}

function formatCompactCurrency(value: number, currency: string) {
  const symbol = currency === "INR" ? "₹" : `${currency} `

  if (Math.abs(value) >= 10000000) {
    return `${symbol}${(value / 10000000).toFixed(1)}Cr`
  }

  if (Math.abs(value) >= 100000) {
    return `${symbol}${(value / 100000).toFixed(1)}L`
  }

  if (Math.abs(value) >= 1000) {
    return `${symbol}${(value / 1000).toFixed(1)}K`
  }

  return `${symbol}${Math.round(value).toLocaleString("en-IN")}`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

function priorityClasses(priority: Insight["priority"]) {
  if (priority === "high") {
    return "border-[#17153B]/15 bg-[#17153B] text-[#F1F0F8]"
  }

  if (priority === "medium") {
    return "border-[#433D8B]/15 bg-[#C8ACD6]/55 text-[#17153B]"
  }

  return "border-[#433D8B]/10 bg-[#FFFFFF] text-[#17153B]"
}

export default function BusinessBrain({ data }: { data: BrainData }) {
  const [activeTab, setActiveTab] = useState<TabId>("all")
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null)

  const insights = useMemo<Insight[]>(() => {
    const result: Insight[] = []

    if (data.currentOrdersCount === 0) {
      result.push({
        id: "revenue-no-signal",
        category: "context",
        title: "There is no revenue signal yet.",
        summary: "Connect or import orders to start building a performance picture.",
        detail:
          "Business Brain needs historical business activity before it can compare performance, identify movement, or explain changes.",
        icon: BarChart3,
        priority: "medium",
        evidence: ["No non-cancelled orders in the last 30 days"],
        href: "/autopsy",
      })
    } else if (data.revenueChange !== null) {
      const direction = data.revenueChange >= 0 ? "up" : "down"
      const magnitude = Math.abs(data.revenueChange)

      result.push({
        id: "revenue-movement",
        category: "performance",
        title: `Revenue is ${direction} ${magnitude.toFixed(1)}%.`,
        summary:
          direction === "up"
            ? "The latest 30 days are ahead of the previous 30-day period."
            : "The latest 30 days are behind the previous 30-day period.",
        detail:
          "This is a performance signal, not a causal conclusion. Nexora can use the connected product, inventory, and supplier context to investigate what changed alongside revenue.",
        icon: direction === "up" ? TrendingUp : TrendingDown,
        priority: direction === "down" ? "high" : "low",
        evidence: [
          `Current 30-day revenue: ${formatCurrency(data.currentRevenue, data.currencyCode)}`,
          `Previous 30-day revenue: ${formatCurrency(data.previousRevenue, data.currencyCode)}`,
          `Current orders: ${data.currentOrdersCount.toLocaleString("en-IN")}`,
        ],
        href: "/autopsy",
      })
    } else {
      result.push({
        id: "revenue-baseline",
        category: "performance",
        title: "Revenue activity has started.",
        summary: "Nexora has enough current order data to establish a baseline.",
        detail:
          "A previous comparable period is not available yet, so Nexora will avoid inventing a growth rate. More history will make the comparison meaningful.",
        icon: BarChart3,
        priority: "low",
        evidence: [
          `Current 30-day revenue: ${formatCurrency(data.currentRevenue, data.currencyCode)}`,
          `Current orders: ${data.currentOrdersCount.toLocaleString("en-IN")}`,
        ],
        href: "/autopsy",
      })
    }

    if (data.lowStock.length > 0) {
      const highestExposure = [...data.lowStock].sort(
        (a, b) => b.reorderLevel - b.quantity - (a.reorderLevel - a.quantity)
      )[0]

      result.push({
        id: "inventory-risk",
        category: "risk",
        title: `${data.lowStock.length} ${data.lowStock.length === 1 ? "item is" : "items are"} below reorder level.`,
        summary: highestExposure
          ? `${highestExposure.productName} is the clearest inventory signal right now.`
          : "Inventory needs attention.",
        detail:
          "Low stock does not automatically mean a stockout is imminent. It is a signal worth investigating against recent demand and supplier lead times.",
        icon: Package,
        priority: "high",
        evidence: data.lowStock.slice(0, 3).map(
          (item) =>
            `${item.productName}: ${item.quantity.toLocaleString("en-IN")} on hand vs ${item.reorderLevel.toLocaleString("en-IN")} reorder level`
        ),
        href: "/inventory",
      })
    } else if (data.inventoryCount > 0) {
      result.push({
        id: "inventory-stable",
        category: "performance",
        title: "Inventory is above recorded reorder levels.",
        summary: "No low-stock records were detected in the current inventory snapshot.",
        detail:
          "This does not guarantee healthy inventory. Demand velocity, supplier lead times, and future orders should be considered before making a purchasing decision.",
        icon: Package,
        priority: "low",
        evidence: [
          `${data.inventoryCount.toLocaleString("en-IN")} inventory records checked`,
          `Inventory value: ${formatCurrency(data.inventoryValue, data.currencyCode)}`,
        ],
        href: "/inventory",
      })
    }

    if (data.supplierRisks.length > 0) {
      const supplier = data.supplierRisks[0]

      result.push({
        id: "supplier-risk",
        category: "risk",
        title: `${data.supplierRisks.length} supplier ${data.supplierRisks.length === 1 ? "needs" : "need"} a closer look.`,
        summary: supplier
          ? `${supplier.name} has a lead-time or reliability signal.`
          : "Supplier performance signals need attention.",
        detail:
          "Nexora flags suppliers using the lead-time and reliability values currently recorded in your workspace. These are risk indicators, not predictions of failure.",
        icon: Truck,
        priority: "medium",
        evidence: data.supplierRisks.slice(0, 3).map((item) => {
          const lead = item.leadTime === null ? "lead time unavailable" : `${item.leadTime} days lead time`
          const reliability =
            item.reliability === null
              ? "reliability unavailable"
              : `${item.reliability.toFixed(0)}% reliability`
          return `${item.name}: ${lead}; ${reliability}`
        }),
        href: "/suppliers",
      })
    }

    const topProduct = data.topProducts[0]

    if (topProduct) {
      result.push({
        id: "product-opportunity",
        category: "opportunity",
        title: `${topProduct.name} is leading current product revenue.`,
        summary: topProduct.lowStock
          ? "Strong sales and low stock make this product worth watching closely."
          : "This product currently contributes the most recorded product revenue.",
        detail: topProduct.lowStock
          ? "Nexora cannot conclude that low stock caused any revenue movement, but the combination is a useful signal for investigation."
          : "This is a concentration signal. Understanding what is driving this product can help explain where current business activity is coming from.",
        icon: Target,
        priority: topProduct.lowStock ? "high" : "low",
        evidence: [
          `Current product revenue: ${formatCurrency(topProduct.revenue, data.currencyCode)}`,
          `Quantity sold: ${topProduct.quantity.toLocaleString("en-IN")}`,
          topProduct.lowStock ? "Current inventory is at or below reorder level" : "No low-stock flag for this product",
        ],
        href: "/entities",
      })
    }

    if (data.recommendations.length > 0) {
      const recommendation = data.recommendations[0]

      result.push({
        id: "stored-recommendation",
        category: "opportunity",
        title: recommendation.title,
        summary: recommendation.reason || "A recommendation is ready for review.",
        detail:
          "This recommendation was stored in Nexora's recommendations layer. Its evidence and confidence can be reviewed before acting on it.",
        icon: Sparkles,
        priority: recommendation.confidence >= 80 ? "high" : "medium",
        evidence: [
          recommendation.confidence > 0
            ? `Confidence: ${recommendation.confidence.toFixed(0)}%`
            : "Confidence not recorded",
          recommendation.reason || "No reason recorded",
        ],
        href: "/changes",
      })
    }

    return result
  }, [data])

  const filteredInsights =
    activeTab === "all"
      ? insights
      : insights.filter((insight) => insight.category === activeTab)

  const selectedInsight =
    insights.find((insight) => insight.id === selectedInsightId) ??
    filteredInsights[0] ??
    insights[0]

  const hasBusinessContext = data.connectedSignals > 0
  const coveragePercent =
    data.datasetsCount > 0
      ? Math.round((data.readyDatasetsCount / data.datasetsCount) * 100)
      : 0

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Header */}
      <Breadcrumbs items={[{ label: "Business overview", href: "/dashboard" }, { label: "Business Brain" }]} />

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#433D8B]" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#433D8B]/55">
              Business Brain
            </p>
          </div>

          <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.045em] text-[#17153B] sm:text-4xl lg:text-5xl">
            Understand what your business is telling you.
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#433D8B]/65">
            Nexora connects the signals already available in {data.businessName} and
            separates observations from conclusions.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="group inline-flex w-fit items-center gap-2 rounded-xl border border-[#433D8B]/15 bg-[#FFFFFF] px-4 py-2.5 text-xs font-medium text-[#2E236C] transition hover:bg-[#C8ACD6]/45"
        >
          Back to overview
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Brain status */}
      <section className="mt-7 overflow-hidden rounded-[26px] bg-[#17153B] text-[#F1F0F8] shadow-[0_18px_50px_rgba(45,35,46,0.12)]">
        <div className="grid lg:grid-cols-[1fr_auto]">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F1F0F8]/10">
                <Brain className="h-4 w-4 text-[#C8ACD6]" />
              </div>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#C8ACD6]/45">
                  Nexora&apos;s read
                </p>
                <p className="mt-0.5 text-xs text-[#F1F0F8]/75">
                  {hasBusinessContext
                    ? "Your connected signals are being interpreted together."
                    : "Your workspace needs business signals before interpretation can begin."}
                </p>
              </div>
            </div>

            <div className="mt-8 max-w-3xl">
              <h2 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
                {insights[0]?.title ?? "Your business context is ready."}
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#C8ACD6]/60">
                {insights[0]?.summary ??
                  "Add business data and Nexora will start turning isolated numbers into connected context."}
              </p>
            </div>
          </div>

          <div className="border-t border-[#F1F0F8]/10 p-6 lg:w-72 lg:border-l lg:border-t-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#C8ACD6]/40">
              Connected context
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
              {data.connectedSignals}/5
            </p>

            <p className="mt-1 text-[10px] leading-5 text-[#C8ACD6]/50">
              core signal groups currently available to Business Brain
            </p>

            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#F1F0F8]/10">
              <div
                className="h-full rounded-full bg-[#C8ACD6] transition-all duration-500"
                style={{ width: `${(data.connectedSignals / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Revenue · 30 days"
          value={formatCompactCurrency(data.currentRevenue, data.currencyCode)}
          detail={
            data.revenueChange === null
              ? "No comparable period yet"
              : `${data.revenueChange >= 0 ? "+" : ""}${data.revenueChange.toFixed(1)}% vs previous 30 days`
          }
          icon={data.revenueChange !== null && data.revenueChange < 0 ? TrendingDown : TrendingUp}
        />

        <Metric
          label="Average order"
          value={formatCompactCurrency(data.averageOrderValue, data.currencyCode)}
          detail={`${data.currentOrdersCount.toLocaleString("en-IN")} orders in the current period`}
          icon={BarChart3}
        />

        <Metric
          label="Inventory value"
          value={formatCompactCurrency(data.inventoryValue, data.currencyCode)}
          detail={
            data.lowStock.length > 0
              ? `${data.lowStock.length} low-stock records`
              : "No low-stock records"
          }
          icon={Package}
        />

        <Metric
          label="Data readiness"
          value={`${coveragePercent}%`}
          detail={
            data.datasetsCount > 0
              ? `${data.readyDatasetsCount} of ${data.datasetsCount} datasets ready`
              : "No datasets connected"
          }
          icon={Database}
        />
      </section>

      {/* Insight workspace */}
      <section className="mt-5 grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="overflow-hidden rounded-2xl border border-[#433D8B]/10 bg-[#FFFFFF] shadow-[0_12px_35px_rgba(45,35,46,0.04)]">
          <div className="border-b border-[#433D8B]/10 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#433D8B]/45">
                  Signals worth understanding
                </p>
                <h2 className="mt-1 text-sm font-semibold text-[#17153B]">
                  What Nexora noticed
                </h2>
              </div>

              <div className="flex flex-wrap gap-1 rounded-xl bg-[#F1F0F8] p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-lg px-3 py-2 text-[10px] font-medium transition ${
                      activeTab === tab.id
                        ? "bg-[#FFFFFF] text-[#17153B] shadow-sm"
                        : "text-[#433D8B]/55 hover:text-[#17153B]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="divide-y divide-[#433D8B]/10">
            {filteredInsights.length > 0 ? (
              filteredInsights.map((insight) => {
                const Icon = insight.icon
                const selected = selectedInsight?.id === insight.id

                return (
                  <button
                    key={insight.id}
                    type="button"
                    onClick={() => setSelectedInsightId(insight.id)}
                    className={`group flex w-full items-start gap-4 p-5 text-left transition sm:p-6 ${
                      selected ? "bg-[#F1F0F8]/55" : "hover:bg-[#F1F0F8]/35"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C8ACD6]/55">
                      <Icon className="h-4 w-4 text-[#433D8B]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[#17153B]">
                          {insight.title}
                        </p>

                        <span
                          className={`rounded-full border px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] ${priorityClasses(insight.priority)}`}
                        >
                          {insight.priority}
                        </span>
                      </div>

                      <p className="mt-1 text-xs leading-5 text-[#433D8B]/60">
                        {insight.summary}
                      </p>
                    </div>

                    <ChevronRight
                      className={`mt-1 h-4 w-4 shrink-0 text-[#433D8B]/25 transition-transform ${
                        selected ? "translate-x-0.5 text-[#433D8B]/60" : "group-hover:translate-x-0.5"
                      }`}
                    />
                  </button>
                )
              })
            ) : (
              <div className="p-6">
                <EmptyState
                  title="No signals in this view yet."
                  description="As more business data becomes available, Nexora will place relevant observations here."
                />
              </div>
            )}
          </div>
        </div>

        {/* Explanation panel */}
        <div className="rounded-2xl border border-[#433D8B]/10 bg-[#F1F0F8] p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <CircleAlert className="h-4 w-4 text-[#433D8B]" />
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#433D8B]/50">
              Why this matters
            </p>
          </div>

          {selectedInsight ? (
            <>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.035em] text-[#17153B]">
                {selectedInsight.title}
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#433D8B]/65">
                {selectedInsight.detail}
              </p>

              <div className="mt-7 rounded-2xl border border-[#433D8B]/10 bg-[#FFFFFF] p-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#433D8B]/40">
                  Evidence
                </p>

                <div className="mt-4 space-y-3">
                  {selectedInsight.evidence.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#433D8B]" />
                      <p className="text-xs leading-5 text-[#433D8B]/70">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedInsight.href && (
                <Link
                  href={selectedInsight.href}
                  className="group mt-5 inline-flex items-center gap-2 text-xs font-medium text-[#17153B]"
                >
                  Investigate the underlying data
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              )}
            </>
          ) : (
            <EmptyState
              title="Nothing selected yet."
              description="Select a signal to see the evidence Nexora used to surface it."
            />
          )}
        </div>
      </section>

      {/* Supporting context */}
      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#433D8B]/10 bg-[#FFFFFF] shadow-[0_12px_35px_rgba(45,35,46,0.04)]">
          <div className="border-b border-[#433D8B]/10 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-[#433D8B]" />
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#433D8B]/45">
                Product context
              </p>
            </div>
            <h2 className="mt-1 text-sm font-semibold text-[#17153B]">
              Where current sales are concentrated
            </h2>
          </div>

          <div className="p-5 sm:p-6">
            {data.topProducts.length > 0 ? (
              <div className="space-y-3">
                {data.topProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 rounded-xl border border-[#433D8B]/10 p-3"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#C8ACD6]/55 text-[9px] font-semibold text-[#433D8B]">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-[#17153B]">
                        {product.name}
                      </p>
                      <p className="mt-0.5 text-[9px] text-[#433D8B]/45">
                        {product.category || "Uncategorised"} · {product.quantity.toLocaleString("en-IN")} units
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-semibold text-[#17153B]">
                        {formatCompactCurrency(product.revenue, data.currencyCode)}
                      </p>
                      {product.lowStock && (
                        <p className="mt-0.5 text-[8px] font-medium text-[#433D8B]">
                          Low stock
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No product sales yet"
                description="Once order items are connected to products, Nexora can show where sales are concentrated."
              />
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[#433D8B]/10 bg-[#FFFFFF] shadow-[0_12px_35px_rgba(45,35,46,0.04)]">
          <div className="border-b border-[#433D8B]/10 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-[#433D8B]" />
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#433D8B]/45">
                Supply context
              </p>
            </div>
            <h2 className="mt-1 text-sm font-semibold text-[#17153B]">
              Supplier signals worth watching
            </h2>
          </div>

          <div className="p-5 sm:p-6">
            {data.supplierRisks.length > 0 ? (
              <div className="space-y-3">
                {data.supplierRisks.map((supplier) => (
                  <Link
                    key={supplier.id}
                    href="/suppliers"
                    className="group flex items-center gap-3 rounded-xl border border-[#433D8B]/10 p-3 transition hover:bg-[#F1F0F8]/45"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#C8ACD6]/55">
                      <Truck className="h-3.5 w-3.5 text-[#433D8B]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-[#17153B]">
                        {supplier.name}
                      </p>
                      <p className="mt-0.5 text-[9px] text-[#433D8B]/45">
                        {supplier.leadTime === null
                          ? "Lead time unavailable"
                          : `${supplier.leadTime} days lead time`}
                        {supplier.reliability !== null
                          ? ` · ${supplier.reliability.toFixed(0)}% reliability`
                          : ""}
                      </p>
                    </div>

                    <ArrowRight className="h-3.5 w-3.5 text-[#433D8B]/25 transition-transform group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title={data.suppliersCount > 0 ? "No supplier risk signal" : "No suppliers connected"}
                description={
                  data.suppliersCount > 0
                    ? "Current supplier lead-time and reliability values do not cross Nexora's risk thresholds."
                    : "Connect suppliers to let Nexora include supply context in its analysis."
                }
              />
            )}
          </div>
        </section>
      </section>

      {/* Events and recommendations */}
      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#433D8B]/10 bg-[#FFFFFF] shadow-[0_12px_35px_rgba(45,35,46,0.04)]">
          <div className="border-b border-[#433D8B]/10 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-2">
              <CircleAlert className="h-4 w-4 text-[#433D8B]" />
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#433D8B]/45">
                Business events
              </p>
            </div>
            <h2 className="mt-1 text-sm font-semibold text-[#17153B]">
              Recent context
            </h2>
          </div>

          <div className="p-5 sm:p-6">
            {data.events.length > 0 ? (
              <div className="space-y-4">
                {data.events.map((event) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#C8ACD6]/55">
                      <CircleAlert className="h-3.5 w-3.5 text-[#433D8B]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-medium text-[#17153B]">
                          {event.title}
                        </p>
                        {event.severity && (
                          <span className="rounded-full bg-[#F1F0F8] px-2 py-0.5 text-[8px] font-medium capitalize text-[#433D8B]/60">
                            {event.severity}
                          </span>
                        )}
                      </div>
                      {event.description && (
                        <p className="mt-1 text-[10px] leading-5 text-[#433D8B]/55">
                          {event.description}
                        </p>
                      )}
                      <p className="mt-1 text-[9px] text-[#433D8B]/35">
                        {formatDate(event.occurredAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No business events yet"
                description="As your workspace accumulates meaningful events, they will become part of the context Business Brain can inspect."
              />
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[#433D8B]/10 bg-[#F1F0F8] shadow-[0_12px_35px_rgba(45,35,46,0.03)]">
          <div className="border-b border-[#433D8B]/10 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#433D8B]" />
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#433D8B]/45">
                Recommendations
              </p>
            </div>
            <h2 className="mt-1 text-sm font-semibold text-[#17153B]">
              Decisions waiting for review
            </h2>
          </div>

          <div className="p-5 sm:p-6">
            {data.recommendations.length > 0 ? (
              <div className="space-y-3">
                {data.recommendations.map((recommendation) => (
                  <Link
                    key={recommendation.id}
                    href="/recommendations"
                    className="group block rounded-xl border border-[#433D8B]/10 bg-[#FFFFFF] p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#17153B] text-[#C8ACD6]">
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#17153B]">
                          {recommendation.title}
                        </p>
                        <p className="mt-1 text-[10px] leading-5 text-[#433D8B]/55">
                          {recommendation.reason || "Ready for review."}
                        </p>
                        {recommendation.confidence > 0 && (
                          <p className="mt-2 text-[9px] font-medium text-[#433D8B]/45">
                            {recommendation.confidence.toFixed(0)}% confidence
                          </p>
                        )}
                      </div>
                      <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-[#433D8B]/25 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No recommendations yet"
                description="Nexora will only show recommendations here when there is enough connected evidence to support one."
              />
            )}
          </div>
        </section>
      </section>

      {/* Bottom principle */}
      <section className="mt-5 rounded-2xl border border-[#433D8B]/10 bg-[#FFFFFF] p-5 shadow-[0_12px_35px_rgba(45,35,46,0.04)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C8ACD6]/55">
              <AlertTriangle className="h-4 w-4 text-[#433D8B]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#17153B]">
                Nexora separates evidence from interpretation.
              </p>
              <p className="mt-1 max-w-3xl text-[10px] leading-5 text-[#433D8B]/50">
                A signal is not automatically a cause, and a recommendation is not automatically a decision. Business Brain shows the evidence first so you can investigate with context.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="group inline-flex shrink-0 items-center gap-2 text-xs font-medium text-[#17153B]"
          >
            See the underlying dashboard
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  )
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: string
  detail: string
  icon: typeof TrendingUp
}) {
  return (
    <div className="rounded-2xl border border-[#433D8B]/10 bg-[#FFFFFF] p-5 shadow-[0_12px_35px_rgba(45,35,46,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(45,35,46,0.07)]">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#433D8B]/45">
          {label}
        </p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C8ACD6]/55">
          <Icon className="h-3.5 w-3.5 text-[#433D8B]" />
        </div>
      </div>

      <p className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-[#17153B]">
        {value}
      </p>
      <p className="mt-1 text-[10px] leading-5 text-[#433D8B]/50">{detail}</p>
    </div>
  )
}

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-28 flex-col justify-center rounded-xl border border-dashed border-[#433D8B]/10 bg-[#F1F0F8]/40 px-5 py-6">
      <p className="text-xs font-medium text-[#17153B]">{title}</p>
      <p className="mt-1 max-w-xl text-[10px] leading-5 text-[#433D8B]/50">
        {description}
      </p>
    </div>
  )
}