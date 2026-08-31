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
  Users,
} from "lucide-react"

type TrendPoint = { label: string; value: number }
type RecentOrder = { orderNumber: string; customer: string; amount: number; status: string; date: string }
type ProductPoint = { name: string; value: number }
type Insight = { title: string; description: string; evidence: string }

type DashboardData = {
  currencyCode: string
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
  insight: Insight
}

function currency(value: number, code: string) {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: code, maximumFractionDigits: 0 }).format(value)
  } catch {
    return `${code} ${Math.round(value).toLocaleString("en-IN")}`
  }
}

function compactCurrency(value: number, code: string) {
  const symbol = code === "INR" ? "₹" : `${code} `
  if (Math.abs(value) >= 10000000) return `${symbol}${(value / 10000000).toFixed(1)}Cr`
  if (Math.abs(value) >= 100000) return `${symbol}${(value / 100000).toFixed(1)}L`
  if (Math.abs(value) >= 1000) return `${symbol}${(value / 1000).toFixed(1)}K`
  return `${symbol}${Math.round(value).toLocaleString("en-IN")}`
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(new Date(`${value}T00:00:00`))
}

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: React.ElementType }) {
  return (
    <div className="rounded-2xl border border-[#E7E4EF] bg-white p-5 shadow-[0_12px_35px_rgba(23,21,59,0.04)] transition hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#68647A]">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F1F0F8] text-[#433D8B]"><Icon className="h-4 w-4" /></div>
      </div>
      <p className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-[#17153B]">{value}</p>
      <p className="mt-1 text-[10px] text-[#68647A]">{detail}</p>
    </div>
  )
}

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const maxTrend = Math.max(...data.trend.map((point) => point.value), 1)
  const maxProduct = Math.max(...data.topProducts.map((product) => product.value), 1)

  return (
    <div className="w-full">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#433D8B]">Live business intelligence</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[#17153B] sm:text-4xl">See what&apos;s happening.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68647A]">These numbers are calculated from the business data connected to Nexora.</p>
        </div>
        <Link href="/data-hub" className="group inline-flex w-fit items-center gap-2 rounded-xl bg-[#17153B] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[#2E236C]">
          Connect more data <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {!data.hasData && (
        <section className="mt-7 rounded-2xl border border-[#C8ACD6]/40 bg-white p-6">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C8ACD6]/25 text-[#433D8B]"><Database className="h-5 w-5" /></div>
            <div>
              <p className="text-sm font-semibold text-[#17153B]">Your workspace is waiting for its first dataset.</p>
              <p className="mt-1 text-xs leading-5 text-[#68647A]">Connect an orders, inventory, customer or supplier dataset and Nexora will start calculating business signals.</p>
            </div>
          </div>
        </section>
      )}

      <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Revenue" value={data.revenue ? compactCurrency(data.revenue, data.currencyCode) : "—"} detail={data.ordersCount ? `${data.ordersCount.toLocaleString("en-IN")} completed orders` : "Waiting for order data"} icon={ShoppingCart} />
        <Metric label="Units sold" value={data.unitsSold ? data.unitsSold.toLocaleString("en-IN") : "—"} detail={data.unitsSold ? "From connected order rows" : "Waiting for quantity data"} icon={BarChart3} />
        <Metric label="Average order value" value={data.averageOrderValue ? currency(data.averageOrderValue, data.currencyCode) : "—"} detail={data.ordersCount ? "Revenue ÷ completed orders" : "Waiting for orders"} icon={Sparkles} />
        <Metric label="Customers" value={data.customersCount ? data.customersCount.toLocaleString("en-IN") : "—"} detail={data.customersCount ? "Unique customers in orders" : "Waiting for customer data"} icon={Users} />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
        <section className="overflow-hidden rounded-2xl border border-[#E7E4EF] bg-white shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <div className="flex items-start justify-between border-b border-[#E7E4EF] px-5 py-5 sm:px-6">
            <div><p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#68647A]">Revenue movement</p><h2 className="mt-1 text-sm font-semibold text-[#17153B]">Last 30 days</h2></div>
            <span className="rounded-lg bg-[#F1F0F8] px-2.5 py-1.5 text-[9px] text-[#433D8B]">Live</span>
          </div>
          <div className="px-5 pb-5 pt-7 sm:px-6 sm:pb-6">
            {data.trend.some((point) => point.value > 0) ? (
              <>
                <div className="flex h-52 items-end gap-1 sm:gap-1.5">
                  {data.trend.map((point, index) => (
                    <div key={`${point.label}-${index}`} className="group flex h-full min-w-0 flex-1 flex-col justify-end" title={`${point.label}: ${currency(point.value, data.currencyCode)}`}>
                      <div className="w-full rounded-t-md bg-[#433D8B]/55 transition group-hover:bg-[#2E236C]" style={{ height: `${Math.max((point.value / maxTrend) * 100, 3)}%` }} />
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between text-[8px] uppercase tracking-[0.12em] text-[#68647A]"><span>{data.trend[0]?.label}</span><span>{data.trend.at(-1)?.label}</span></div>
              </>
            ) : (
              <div className="flex min-h-52 items-center justify-center rounded-xl border border-dashed border-[#E7E4EF] bg-[#F1F0F8]/60 text-center"><p className="text-xs text-[#68647A]">Connect an orders dataset to see revenue movement.</p></div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[#E7E4EF] bg-white shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <div className="border-b border-[#E7E4EF] px-5 py-5"><p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#68647A]">Nexora&apos;s read</p><h2 className="mt-1 text-sm font-semibold text-[#17153B]">What stands out</h2></div>
          <div className="p-5">
            <div className="rounded-xl bg-[#17153B] p-5 text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C8ACD6]/20 text-[#C8ACD6]"><Brain className="h-4 w-4" /></div>
              <h3 className="mt-4 text-sm font-semibold leading-5">{data.insight.title}</h3>
              <p className="mt-2 text-[10px] leading-5 text-white/65">{data.insight.description}</p>
              <div className="mt-4 border-t border-white/10 pt-3 text-[9px] text-[#C8ACD6]">{data.insight.evidence}</div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-[#E7E4EF] bg-white p-5 shadow-[0_12px_35px_rgba(23,21,59,0.04)] sm:p-6">
          <div className="flex items-center justify-between"><div><p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#68647A]">Products</p><h2 className="mt-1 text-sm font-semibold text-[#17153B]">Top revenue drivers</h2></div><Package className="h-4 w-4 text-[#433D8B]" /></div>
          {data.topProducts.length ? (
            <div className="mt-5 space-y-4">
              {data.topProducts.map((product, index) => (
                <div key={product.name}>
                  <div className="flex items-center justify-between gap-3 text-xs"><span className="min-w-0 truncate font-medium text-[#17153B]">{index + 1}. {product.name}</span><span className="shrink-0 text-[#68647A]">{compactCurrency(product.value, data.currencyCode)}</span></div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#F1F0F8]"><div className="h-full rounded-full bg-[#433D8B]" style={{ width: `${(product.value / maxProduct) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          ) : <Empty text="Product-level revenue will appear when Nexora detects a product field." />}
        </section>

        <section className="rounded-2xl border border-[#E7E4EF] bg-white p-5 shadow-[0_12px_35px_rgba(23,21,59,0.04)] sm:p-6">
          <div className="flex items-center justify-between"><div><p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#68647A]">Order activity</p><h2 className="mt-1 text-sm font-semibold text-[#17153B]">Recent connected orders</h2></div><ShoppingCart className="h-4 w-4 text-[#433D8B]" /></div>
          {data.recentOrders.length ? (
            <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[560px] text-left"><thead><tr className="border-b border-[#E7E4EF] text-[9px] uppercase tracking-[0.12em] text-[#68647A]"><th className="py-3">Order</th><th className="py-3">Customer</th><th className="py-3">Date</th><th className="py-3 text-right">Amount</th></tr></thead><tbody>{data.recentOrders.map((order) => <tr key={order.orderNumber} className="border-b border-[#E7E4EF]/60 last:border-0"><td className="py-3 text-xs font-medium text-[#17153B]">{order.orderNumber}</td><td className="py-3 text-xs text-[#68647A]">{order.customer}</td><td className="py-3 text-xs text-[#68647A]">{dateLabel(order.date)}</td><td className="py-3 text-right text-xs font-medium text-[#17153B]">{currency(order.amount, data.currencyCode)}</td></tr>)}</tbody></table></div>
          ) : <Empty text="Recent orders will appear after an orders dataset is connected." />}
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-[#E7E4EF] bg-white p-5 shadow-[0_12px_35px_rgba(23,21,59,0.04)] sm:p-6">
        <div className="flex items-center gap-2"><CircleAlert className="h-4 w-4 text-[#433D8B]" /><p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#68647A]">Data signals</p></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Signal icon={Database} title="Connected datasets" value={String(data.datasetCount)} detail="Ready datasets in this workspace" />
          <Signal icon={RotateCcw} title="Returns / cancellations" value={String(data.returnsCount)} detail="Rows excluded from revenue totals" />
          <Signal icon={Brain} title="Business Brain" value="Ready" detail="Uses the same connected data context" />
        </div>
      </section>
    </div>
  )
}

function Signal({ icon: Icon, title, value, detail }: { icon: React.ElementType; title: string; value: string; detail: string }) {
  return <div className="rounded-xl border border-[#E7E4EF] bg-[#F1F0F8]/60 p-4"><div className="flex items-center gap-2 text-[#433D8B]"><Icon className="h-3.5 w-3.5" /><span className="text-[9px] font-semibold uppercase tracking-[0.12em]">{title}</span></div><p className="mt-3 text-lg font-semibold text-[#17153B]">{value}</p><p className="mt-1 text-[10px] leading-5 text-[#68647A]">{detail}</p></div>
}

function Empty({ text }: { text: string }) {
  return <div className="mt-5 flex min-h-28 items-center justify-center rounded-xl border border-dashed border-[#E7E4EF] bg-[#F1F0F8]/55 px-5 text-center"><p className="text-[10px] leading-5 text-[#68647A]">{text}</p></div>
}
