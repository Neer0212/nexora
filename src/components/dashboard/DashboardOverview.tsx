"use client"

import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  Brain,
  CircleAlert,
  Database,
  Package,
  RotateCcw,
  ShoppingCart,
  Sparkles,
  Truck,
  Users,
} from "lucide-react"
import type { ElementType } from "react"
import type { IndustryConfig } from "@/lib/industries"

type TrendPoint = { label: string; value: number }
type RecentOrder = {
  orderNumber: string
  customer: string
  amount: number
  status: string
  date: string
}
type ProductPoint = { name: string; value: number }
type Insight = { title: string; description: string; evidence: string }

type DashboardData = {
  currencyCode: string
  industryConfig: IndustryConfig
  hasData: boolean
  revenue: number
  ordersCount: number
  unitsSold: number
  averageOrderValue: number
  inventoryValue: number
  inventoryCount: number
  lowStockCount: number
  suppliersCount: number
  customersCount: number
  datasetCount: number
  readyDatasetCount: number
  trend: TrendPoint[]
  recentOrders: RecentOrder[]
  events: never[]
  topProducts: ProductPoint[]
  returnsCount: number
  atRiskSuppliers: number
  financeRevenue: number
  cogs: number | null
  operatingExpenses: number
  grossProfit: number | null
  connected: {
    products: boolean
    inventory: boolean
    suppliers: boolean
    customers: boolean
    finance: boolean
  }
  insight: Insight
  // Phase 10: authoritative operational metrics
  ops: {
    netSales: number
    returns: number
    grossPaymentsCollected: number
    refundsIssued: number
    netPaymentsCollected: number
    expenses: number
    outOfStockCount: number
    pendingPurchases: number
    partiallyReceived: number
    receivedPurchases: number
  } | null
}

function currency(value: number, code: string) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${code} ${Math.round(value).toLocaleString("en-IN")}`
  }
}

function compactCurrency(value: number, code: string) {
  const symbol = code === "INR" ? "₹" : `${code} `

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

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T00:00:00`))
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
  icon: ElementType
}) {
  return (
    <div className="bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-500">
          {label}
        </p>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-50 text-blue-600">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950">
        {value}
      </p>
      <p className="mt-1 text-xs text-zinc-500">{detail}</p>
    </div>
  )
}

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const maxTrend = Math.max(...data.trend.map((point) => point.value), 1)
  const maxProduct = Math.max(...data.topProducts.map((product) => product.value), 1)
  const t = data.industryConfig.terminology

  return (
    <div className="w-full">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium text-blue-600">
            Live business intelligence
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            {t.dashboardTagline}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            These numbers are calculated from the business data connected to Nexora.
          </p>
        </div>
        <Link
          href="/data-hub"
          className="group inline-flex w-fit items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-blue-800"
        >
          Connect more data
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <section className="mt-7 grid grid-cols-1 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200">
        <Metric
          label={t.revenueLabel}
          value={data.revenue ? compactCurrency(data.revenue, data.currencyCode) : "—"}
          detail={
            data.ordersCount
              ? `${data.ordersCount.toLocaleString("en-IN")} ${t.ordersLabel.toLowerCase()}`
              : `Waiting for ${t.order.plural.toLowerCase()}`
          }
          icon={ShoppingCart}
        />
        <Metric
          label={t.unitsLabel}
          value={data.unitsSold ? data.unitsSold.toLocaleString("en-IN") : "—"}
          detail={data.unitsSold ? `From connected ${t.order.plural.toLowerCase()}` : `Waiting for ${t.order.plural.toLowerCase()}`}
          icon={BarChart3}
        />
        <Metric
          label={t.averageOrderValueLabel}
          value={data.averageOrderValue ? currency(data.averageOrderValue, data.currencyCode) : "—"}
          detail={data.ordersCount ? `${t.revenueLabel} ÷ ${t.ordersLabel.toLowerCase()}` : `Waiting for ${t.order.plural.toLowerCase()}`}
          icon={Sparkles}
        />
        <Metric
          label={t.customersLabel}
          value={data.customersCount ? data.customersCount.toLocaleString("en-IN") : "—"}
          detail={data.customersCount ? `Unique ${t.customer.plural.toLowerCase()}` : `Waiting for ${t.customer.plural.toLowerCase()}`}
          icon={Users}
        />
      </section>


      <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-start justify-between border-b border-zinc-200 px-5 py-5 sm:px-6">
            <div>
              <p className="text-xs font-medium text-zinc-500">
                Revenue movement
              </p>
              <h2 className="mt-1 text-sm font-semibold text-zinc-950">Last 30 days</h2>
            </div>
            <span className="rounded-lg bg-zinc-50 px-2.5 py-1.5 text-[9px] text-blue-600">
              Live
            </span>
          </div>
          <div className="px-5 pb-5 pt-7 sm:px-6 sm:pb-6">
            {data.trend.some((point) => point.value > 0) ? (
              <>
                <div className="flex h-52 items-end gap-1 sm:gap-1.5">
                  {data.trend.map((point, index) => (
                    <div
                      key={`${point.label}-${index}`}
                      className="group flex h-full min-w-0 flex-1 flex-col justify-end"
                      title={`${point.label}: ${currency(point.value, data.currencyCode)}`}
                    >
                      <div
                        className="w-full rounded-t-md bg-blue-600/55 transition group-hover:bg-blue-800"
                        style={{
                          height: `${Math.max((point.value / maxTrend) * 100, 3)}%`,
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between text-xs font-medium text-zinc-500">
                  <span>{data.trend[0]?.label}</span>
                  <span>{data.trend.at(-1)?.label}</span>
                </div>
              </>
            ) : (
              <Empty text="Connect an orders dataset to see revenue movement." />
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-5 py-5">
            <p className="text-xs font-medium text-zinc-500">
              Nexora&apos;s read
            </p>
            <h2 className="mt-1 text-sm font-semibold text-zinc-950">What stands out</h2>
          </div>
          <div className="p-5">
            <div className="rounded-xl bg-zinc-950 p-5 text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-200/20 text-blue-200">
                <Brain className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-sm font-semibold leading-5">{data.insight.title}</h3>
              <p className="mt-2 text-[10px] leading-5 text-white/65">
                {data.insight.description}
              </p>
              <div className="mt-4 border-t border-white/10 pt-3 text-[9px] text-blue-200">
                {data.insight.evidence}
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-500">
              Business coverage
            </p>
            <h2 className="mt-1 text-sm font-semibold text-zinc-950">
              What Nexora can see
            </h2>
          </div>
          <Database className="h-4 w-4 text-blue-600" />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Coverage label="Products" connected={data.connected.products} />
          <Coverage label="Inventory" connected={data.connected.inventory} />
          <Coverage label="Suppliers" connected={data.connected.suppliers} />
          <Coverage label="Customers" connected={data.connected.customers} />
          <Coverage label="Finance" connected={data.connected.finance} />
        </div>
      </section>

      <div className="mt-5 grid grid-cols-1 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm xl:grid-cols-3 divide-y xl:divide-y-0 xl:divide-x divide-zinc-200">
        <SignalCard
          icon={Package}
          title="Inventory"
          value={data.inventoryValue ? compactCurrency(data.inventoryValue, data.currencyCode) : data.inventoryCount ? String(data.inventoryCount) : "—"}
          detail={
            data.ops?.outOfStockCount
              ? `${data.ops.outOfStockCount} item${data.ops.outOfStockCount === 1 ? "" : "s"} out of stock`
              : data.lowStockCount
                ? `${data.lowStockCount} item${data.lowStockCount === 1 ? "" : "s"} low stock`
                : data.inventoryCount
                  ? `${data.inventoryCount} product${data.inventoryCount === 1 ? "" : "s"} tracked`
                  : "No products added yet"
          }
          warning={(data.ops?.outOfStockCount ?? 0) > 0 || data.lowStockCount > 0}
        />
        <SignalCard
          icon={Truck}
          title="Suppliers"
          value={data.suppliersCount ? String(data.suppliersCount) : data.ops?.pendingPurchases ? String(data.ops.pendingPurchases) : "—"}
          detail={
            data.ops
              ? data.ops.partiallyReceived
                ? `${data.ops.partiallyReceived} purchase${data.ops.partiallyReceived === 1 ? "" : "s"} in transit · ${data.ops.pendingPurchases} pending`
                : data.ops.pendingPurchases
                  ? `${data.ops.pendingPurchases} pending purchase${data.ops.pendingPurchases === 1 ? "" : "s"}`
                  : data.ops.receivedPurchases
                    ? `${data.ops.receivedPurchases} received`
                    : "No purchases recorded"
              : data.atRiskSuppliers
                ? `${data.atRiskSuppliers} supplier${data.atRiskSuppliers === 1 ? "" : "s"} need attention`
                : data.suppliersCount
                  ? "No risk signals detected"
                  : "Connect supplier data"
          }
          warning={data.atRiskSuppliers > 0}
        />
        <SignalCard
          icon={CircleAlert}
          title="Finance"
          value={
            data.ops
              ? data.ops.netSales
                ? compactCurrency(data.ops.netSales, data.currencyCode)
                : "—"
              : data.grossProfit !== null
                ? compactCurrency(data.grossProfit, data.currencyCode)
                : "—"
          }
          detail={
            data.ops
              ? data.ops.netSales
                ? `Net sales${data.ops.refundsIssued ? ` · ${compactCurrency(data.ops.refundsIssued, data.currencyCode)} refunded` : ""}${data.ops.expenses ? ` · ${compactCurrency(data.ops.expenses, data.currencyCode)} expenses` : ""}`
                : "No sales recorded yet"
              : data.financeRevenue
                ? `Gross profit from ${compactCurrency(data.financeRevenue, data.currencyCode)} revenue`
                : "Connect finance data"
          }
          warning={false}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500">
                Products
              </p>
              <h2 className="mt-1 text-sm font-semibold text-zinc-950">Top revenue drivers</h2>
            </div>
            <Package className="h-4 w-4 text-blue-600" />
          </div>
          {data.topProducts.length ? (
            <div className="mt-5 space-y-4">
              {data.topProducts.map((product, index) => (
                <div key={product.name}>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="min-w-0 truncate font-medium text-zinc-950">
                      {index + 1}. {product.name}
                    </span>
                    <span className="shrink-0 text-zinc-500">
                      {compactCurrency(product.value, data.currencyCode)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-50">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${(product.value / maxProduct) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty text="Product-level revenue will appear when Nexora detects a product field." />
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500">
                Order activity
              </p>
              <h2 className="mt-1 text-sm font-semibold text-zinc-950">Recent connected orders</h2>
            </div>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </div>
          {data.recentOrders.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="border-b border-zinc-200 text-xs font-medium text-zinc-500">
                    <th className="py-3">Order</th>
                    <th className="py-3">Customer</th>
                    <th className="py-3">Date</th>
                    <th className="py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr
                      key={order.orderNumber}
                      className="border-b border-zinc-200/60 last:border-0"
                    >
                      <td className="py-3 text-xs font-medium text-zinc-950">{order.orderNumber}</td>
                      <td className="py-3 text-xs text-zinc-500">{order.customer}</td>
                      <td className="py-3 text-xs text-zinc-500">{dateLabel(order.date)}</td>
                      <td className="py-3 text-right text-xs font-medium text-zinc-950">
                        {currency(order.amount, data.currencyCode)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty text="Recent orders will appear after an orders dataset is connected." />
          )}
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <CircleAlert className="h-4 w-4 text-blue-600" />
          <p className="text-xs font-medium text-zinc-500">
            Data signals
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Signal icon={Database} title="Connected datasets" value={String(data.datasetCount)} detail="Ready datasets in this workspace" />
          <Signal icon={RotateCcw} title="Returns / cancellations" value={String(data.returnsCount)} detail="Rows excluded from revenue totals" />
          <Signal icon={Brain} title="Business Brain" value="Ready" detail="Uses the same connected data context" />
        </div>
      </section>
    </div>
  )
}

function Coverage({ label, connected }: { label: string; connected: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
      <div className={`h-2 w-2 rounded-full ${connected ? "bg-blue-600" : "bg-[#C8C4D2]"}`} />
      <p className="mt-3 text-xs font-medium text-zinc-950">{label}</p>
      <p className="mt-1 text-[9px] text-zinc-500">{connected ? "Connected" : "Not connected"}</p>
    </div>
  )
}

function SignalCard({
  icon: Icon,
  title,
  value,
  detail,
  warning,
}: {
  icon: ElementType
  title: string
  value: string
  detail: string
  warning: boolean
}) {
  return (
    <div className="bg-white p-5">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-50 text-blue-600">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs font-medium text-zinc-500">{title}</p>
      </div>
      <p className={`mt-5 text-2xl font-semibold tracking-tight ${warning ? "text-blue-600" : "text-zinc-950"}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-zinc-500">{detail}</p>
    </div>
  )
}

function Signal({ icon: Icon, title, value, detail }: { icon: ElementType; title: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
      <div className="flex items-center gap-2 text-blue-600">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">{title}</span>
      </div>
      <p className="mt-3 text-lg font-semibold text-zinc-950">{value}</p>
      <p className="mt-1 text-[10px] leading-5 text-zinc-500">{detail}</p>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="mt-5 flex min-h-28 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/55 px-5 text-center">
      <p className="text-[10px] leading-5 text-zinc-500">{text}</p>
    </div>
  )
}
