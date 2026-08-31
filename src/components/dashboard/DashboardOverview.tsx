"use client"

import Link from "next/link"
import {
  ArrowRight,
  Brain,
  CircleAlert,
  Clock3,
  Database,
  Package,
  ShoppingCart,
  Sparkles,
  Truck,
  Users,
} from "lucide-react"

type TrendPoint = {
  label: string
  value: number
}

type RecentOrder = {
  orderNumber: string
  customer: string
  amount: number
  status: string
  date: string
}

type EventItem = {
  title: string
  description: string | null
  severity: string | null
  occurredAt: string
}

type DashboardData = {
  currencyCode: string
  hasData: boolean
  revenue: number
  ordersCount: number
  inventoryValue: number
  inventoryCount: number
  lowStockCount: number
  suppliersCount: number
  customersCount: number
  datasetCount: number
  readyDatasetCount: number
  trend: TrendPoint[]
  recentOrders: RecentOrder[]
  events: EventItem[]
}

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
  }).format(new Date(`${value}T00:00:00`))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value))
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase()

  return (
    <span className="rounded-full bg-[#E0DDCF]/60 px-2 py-1 text-[9px] font-medium capitalize text-[#474448]">
      {normalized}
    </span>
  )
}

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const maxTrend = Math.max(...data.trend.map((point) => point.value), 1)

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Page heading */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#534B52]" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#534B52]/55">
              Business overview
            </p>
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-[#2D232E] sm:text-4xl">
            See what&apos;s happening.
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#534B52]/65">
            A connected view of the signals currently available across your
            business.
          </p>
        </div>

        <Link
          href="/brain"
          className="group inline-flex w-fit items-center gap-2 rounded-xl bg-[#2D232E] px-4 py-2.5 text-xs font-medium text-[#F1F0EA] transition hover:bg-[#474448]"
        >
          Open Business Brain
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Empty-state / data status */}
      {!data.hasData && (
        <section className="mt-7 rounded-2xl border border-[#534B52]/12 bg-white p-5 shadow-[0_12px_35px_rgba(45,35,46,0.04)] sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E0DDCF]/65">
              <Database className="h-5 w-5 text-[#474448]" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#2D232E]">
                Your workspace is ready for data.
              </p>

              <p className="mt-1 max-w-2xl text-xs leading-5 text-[#534B52]/60">
                These numbers are connected directly to your Supabase business
                data. Once orders, inventory, customers, suppliers, or datasets
                are added, the overview will populate automatically.
              </p>
            </div>

            <div className="shrink-0 rounded-xl border border-[#534B52]/10 bg-[#F1F0EA]/60 px-3 py-2 text-[10px] text-[#534B52]/60">
              No demo data
            </div>
          </div>
        </section>
      )}

      {/* KPI cards */}
      <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Revenue · 60 days"
          value={
            data.revenue
              ? formatCompactCurrency(data.revenue, data.currencyCode)
              : "—"
          }
          detail={
            data.ordersCount
              ? `${data.ordersCount.toLocaleString("en-IN")} orders`
              : "Waiting for orders"
          }
          icon={ShoppingCart}
        />

        <MetricCard
          label="Inventory value"
          value={
            data.inventoryValue
              ? formatCompactCurrency(data.inventoryValue, data.currencyCode)
              : "—"
          }
          detail={
            data.inventoryCount
              ? `${data.inventoryCount.toLocaleString("en-IN")} stock records`
              : "Waiting for inventory"
          }
          icon={Package}
        />

        <MetricCard
          label="Suppliers"
          value={data.suppliersCount ? data.suppliersCount.toLocaleString("en-IN") : "—"}
          detail={
            data.suppliersCount
              ? `${data.lowStockCount} low-stock items need attention`
              : "Waiting for suppliers"
          }
          icon={Truck}
        />

        <MetricCard
          label="Customers"
          value={data.customersCount ? data.customersCount.toLocaleString("en-IN") : "—"}
          detail={
            data.datasetCount
              ? `${data.readyDatasetCount} of ${data.datasetCount} datasets ready`
              : "Waiting for customer data"
          }
          icon={Users}
        />
      </section>

      {/* Main grid */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
        {/* Revenue trend */}
        <section className="overflow-hidden rounded-2xl border border-[#534B52]/10 bg-white shadow-[0_12px_35px_rgba(45,35,46,0.04)]">
          <div className="flex items-start justify-between border-b border-[#534B52]/10 px-5 py-5 sm:px-6">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#534B52]/45">
                Revenue movement
              </p>
              <h2 className="mt-1 text-sm font-semibold text-[#2D232E]">
                Last 30 days
              </h2>
            </div>

            <div className="rounded-lg bg-[#F1F0EA] px-2.5 py-1.5 text-[9px] text-[#534B52]/55">
              Live from orders
            </div>
          </div>

          <div className="px-5 pb-5 pt-7 sm:px-6 sm:pb-6">
            {data.trend.some((point) => point.value > 0) ? (
              <>
                <div className="flex h-52 items-end gap-1 sm:gap-1.5">
                  {data.trend.map((point, index) => {
                    const height = Math.max((point.value / maxTrend) * 100, 3)

                    return (
                      <div
                        key={`${point.label}-${index}`}
                        className="group flex h-full min-w-0 flex-1 flex-col justify-end"
                        title={`${point.label}: ${formatCurrency(point.value, data.currencyCode)}`}
                      >
                        <div
                          className="w-full rounded-t-md bg-[#534B52]/30 transition-colors group-hover:bg-[#2D232E]"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                    )
                  })}
                </div>

                <div className="mt-3 flex justify-between text-[8px] uppercase tracking-[0.12em] text-[#534B52]/35">
                  <span>{data.trend[0]?.label}</span>
                  <span>{data.trend[data.trend.length - 1]?.label}</span>
                </div>
              </>
            ) : (
              <EmptyPanel
                icon={ShoppingCart}
                title="No revenue movement yet"
                description="Add orders to start seeing the business trend here."
              />
            )}
          </div>
        </section>

        {/* Attention */}
        <section className="rounded-2xl border border-[#534B52]/10 bg-white shadow-[0_12px_35px_rgba(45,35,46,0.04)]">
          <div className="border-b border-[#534B52]/10 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-2">
              <CircleAlert className="h-4 w-4 text-[#534B52]" />
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#534B52]/45">
                Needs attention
              </p>
            </div>
            <h2 className="mt-1 text-sm font-semibold text-[#2D232E]">
              Signals worth watching
            </h2>
          </div>

          <div className="p-5 sm:p-6">
            <AttentionItem
              icon={Package}
              title="Low stock"
              value={data.lowStockCount.toLocaleString("en-IN")}
              description={
                data.lowStockCount
                  ? "Inventory records are at or below their reorder level."
                  : "No low-stock records detected."
              }
              href="/inventory"
            />

            <AttentionItem
              icon={Truck}
              title="Suppliers"
              value={data.suppliersCount.toLocaleString("en-IN")}
              description={
                data.suppliersCount
                  ? "Supplier records available for analysis."
                  : "No supplier records yet."
              }
              href="/suppliers"
            />

            <AttentionItem
              icon={Database}
              title="Data readiness"
              value={`${data.readyDatasetCount}/${data.datasetCount}`}
              description={
                data.datasetCount
                  ? "Datasets marked ready in your workspace."
                  : "No datasets have been connected yet."
              }
              href="/dashboard"
              last
            />
          </div>
        </section>
      </div>

      {/* Lower grid */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Recent orders */}
        <section className="overflow-hidden rounded-2xl border border-[#534B52]/10 bg-white shadow-[0_12px_35px_rgba(45,35,46,0.04)]">
          <div className="flex items-center justify-between border-b border-[#534B52]/10 px-5 py-5 sm:px-6">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#534B52]/45">
                Activity
              </p>
              <h2 className="mt-1 text-sm font-semibold text-[#2D232E]">
                Recent orders
              </h2>
            </div>

            <Link
              href="/analytics"
              className="group flex items-center gap-1 text-[10px] font-medium text-[#534B52] hover:text-[#2D232E]"
            >
              View all
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {data.recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead>
                  <tr className="border-b border-[#534B52]/10 text-[9px] uppercase tracking-[0.12em] text-[#534B52]/40">
                    <th className="px-5 py-3 font-medium sm:px-6">Order</th>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 text-right font-medium">Amount</th>
                    <th className="px-5 py-3 text-right font-medium">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr
                      key={order.orderNumber}
                      className="border-b border-[#534B52]/[0.06] last:border-0"
                    >
                      <td className="px-5 py-4 text-xs font-medium text-[#2D232E] sm:px-6">
                        {order.orderNumber}
                      </td>
                      <td className="px-5 py-4 text-xs text-[#534B52]/70">
                        {order.customer}
                      </td>
                      <td className="px-5 py-4 text-xs text-[#534B52]/55">
                        {formatDate(order.date)}
                      </td>
                      <td className="px-5 py-4 text-right text-xs font-medium text-[#2D232E]">
                        {formatCurrency(order.amount, data.currencyCode)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <StatusPill status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6">
              <EmptyPanel
                icon={ShoppingCart}
                title="No orders yet"
                description="Once orders are connected, recent activity will appear here."
              />
            </div>
          )}
        </section>

        {/* Business activity */}
        <section className="rounded-2xl border border-[#534B52]/10 bg-white shadow-[0_12px_35px_rgba(45,35,46,0.04)]">
          <div className="border-b border-[#534B52]/10 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-[#534B52]" />
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#534B52]/45">
                Business events
              </p>
            </div>
            <h2 className="mt-1 text-sm font-semibold text-[#2D232E]">
              What&apos;s changing
            </h2>
          </div>

          <div className="p-5 sm:p-6">
            {data.events.length > 0 ? (
              <div className="space-y-4">
                {data.events.map((event, index) => (
                  <div key={`${event.occurredAt}-${index}`} className="flex gap-3">
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E0DDCF]/55">
                      <Sparkles className="h-3.5 w-3.5 text-[#534B52]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[#2D232E]">
                        {event.title}
                      </p>

                      {event.description && (
                        <p className="mt-1 text-[10px] leading-5 text-[#534B52]/55">
                          {event.description}
                        </p>
                      )}

                      <p className="mt-1 text-[9px] text-[#534B52]/35">
                        {formatDateTime(event.occurredAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyPanel
                icon={Sparkles}
                title="No business events yet"
                description="Nexora will surface meaningful events here as your business data grows."
              />
            )}
          </div>
        </section>
      </div>

      {/* Brain teaser */}
      <section className="mt-5 overflow-hidden rounded-2xl bg-[#2D232E] p-5 text-[#F1F0EA] shadow-[0_18px_50px_rgba(45,35,46,0.12)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F0EA]/10">
              <Brain className="h-5 w-5 text-[#E0DDCF]" />
            </div>

            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-[#E0DDCF]/45">
                Business Brain
              </p>

              <p className="mt-1 text-sm font-medium">
                The more context Nexora has, the more useful its answers become.
              </p>

              <p className="mt-1 max-w-2xl text-[10px] leading-5 text-[#E0DDCF]/50">
                Your dashboard shows the signals. Business Brain will connect
                those signals and explain what they mean together.
              </p>
            </div>
          </div>

          <Link
            href="/brain"
            className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#F1F0EA]/15 px-4 py-2.5 text-xs font-medium text-[#F1F0EA]/80 transition hover:bg-[#F1F0EA]/5 hover:text-[#F1F0EA]"
          >
            Explore Business Brain
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: string
  detail: string
  icon: React.ElementType
}) {
  return (
    <div className="rounded-2xl border border-[#534B52]/10 bg-white p-5 shadow-[0_12px_35px_rgba(45,35,46,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(45,35,46,0.07)]">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#534B52]/45">
          {label}
        </p>

        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E0DDCF]/55">
          <Icon className="h-3.5 w-3.5 text-[#534B52]" />
        </div>
      </div>

      <p className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-[#2D232E]">
        {value}
      </p>

      <p className="mt-1 text-[10px] text-[#534B52]/50">{detail}</p>
    </div>
  )
}

function AttentionItem({
  icon: Icon,
  title,
  value,
  description,
  href,
  last = false,
}: {
  icon: React.ElementType
  title: string
  value: string
  description: string
  href: string
  last?: boolean
}) {
  return (
    <Link
      href={href}
      className={`group flex gap-3 py-4 transition hover:opacity-80 ${
        last ? "" : "border-b border-[#534B52]/10"
      }`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F1F0EA]">
        <Icon className="h-3.5 w-3.5 text-[#534B52]" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-[#2D232E]">{title}</p>
          <span className="text-sm font-semibold text-[#2D232E]">{value}</span>
        </div>

        <p className="mt-1 text-[10px] leading-5 text-[#534B52]/50">
          {description}
        </p>
      </div>

      <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-[#534B52]/25 transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

function EmptyPanel({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-[#534B52]/10 bg-[#F1F0EA]/35 px-5 text-center">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E0DDCF]/60">
        <Icon className="h-3.5 w-3.5 text-[#534B52]" />
      </div>

      <p className="mt-3 text-xs font-medium text-[#2D232E]">{title}</p>

      <p className="mt-1 max-w-xs text-[10px] leading-5 text-[#534B52]/50">
        {description}
      </p>
    </div>
  )
}