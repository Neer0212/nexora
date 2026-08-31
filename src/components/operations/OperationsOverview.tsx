"use client"

import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock3,
  PackageSearch,
  RotateCcw,
  ShoppingCart,
  Truck,
} from "lucide-react"

type OperationsData = {
  orderCount: number
  activeOrders: number
  pending: number
  cancelled: number
  units: number
  revenue: number
  lowStock: number
  outOfStock: number
  inventoryCount: number
  inventoryValue: number
  supplierCount: number
  supplierRisk: number
  topChannels: { name: string; value: number }[]
  productPressure: { name: string; units: number; revenue: number; stock: number | null }[]
  insight: { title: string; description: string; evidence: string }
  latestDate: string | null
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

function compact(value: number, code: string) {
  const symbol = code === "INR" ? "₹" : `${code} `
  if (value >= 10000000) return `${symbol}${(value / 10000000).toFixed(1)}Cr`
  if (value >= 100000) return `${symbol}${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `${symbol}${(value / 1000).toFixed(1)}K`
  return `${symbol}${Math.round(value).toLocaleString("en-IN")}`
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ElementType
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-2xl border border-[#E7E4EF] bg-white p-5 shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#68647A]">
          {label}
        </p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F1F0F8] text-[#433D8B]">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[#17153B]">
        {value}
      </p>
      <p className="mt-1 text-[10px] text-[#68647A]">{detail}</p>
    </div>
  )
}

export default function OperationsOverview({
  businessName,
  currencyCode,
  data,
}: {
  businessName: string
  currencyCode: string
  data: OperationsData
}) {
  const hasOperations = data.orderCount > 0 || data.inventoryCount > 0 || data.supplierCount > 0

  return (
    <div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#433D8B]">
            Operations intelligence
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[#17153B] sm:text-4xl">
            Keep the business moving.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68647A]">
            Nexora connects demand, inventory and suppliers to surface operational pressure before it becomes a problem.
          </p>
          <p className="mt-2 text-[10px] text-[#9A94A8]">
            {businessName}{data.latestDate ? ` · Data through ${data.latestDate}` : ""}
          </p>
        </div>
        <Link
          href="/data-hub"
          className="group inline-flex w-fit items-center gap-2 rounded-xl bg-[#17153B] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[#2E236C]"
        >
          Connect more data
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {!hasOperations && (
        <div className="mt-7 rounded-2xl border border-dashed border-[#C8ACD6] bg-white p-6 text-sm text-[#68647A]">
          Connect Orders, Inventory or Suppliers in Data Hub to activate Operations Intelligence.
        </div>
      )}

      <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={ShoppingCart}
          label="Orders"
          value={data.orderCount ? data.orderCount.toLocaleString("en-IN") : "—"}
          detail={`${data.activeOrders} active · ${data.pending} pending`}
        />
        <Metric
          icon={Clock3}
          label="Pending"
          value={data.pending ? data.pending.toLocaleString("en-IN") : "—"}
          detail="Orders waiting in the flow"
        />
        <Metric
          icon={Boxes}
          label="Low stock"
          value={data.lowStock ? data.lowStock.toLocaleString("en-IN") : "—"}
          detail={`${data.outOfStock} out of stock`}
        />
        <Metric
          icon={Truck}
          label="Supplier risk"
          value={data.supplierRisk ? data.supplierRisk.toLocaleString("en-IN") : "—"}
          detail={`${data.supplierCount} suppliers detected`}
        />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-[#E7E4EF] bg-white p-5 shadow-[0_12px_35px_rgba(23,21,59,0.04)] sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#68647A]">
                Fulfilment health
              </p>
              <h2 className="mt-1 text-sm font-semibold text-[#17153B]">
                Where attention is needed
              </h2>
            </div>
            <PackageSearch className="h-4 w-4 text-[#433D8B]" />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Health icon={CheckCircle2} label="Active orders" value={data.activeOrders} />
            <Health icon={Clock3} label="Pending" value={data.pending} />
            <Health icon={RotateCcw} label="Returned / cancelled" value={data.cancelled} />
          </div>

          <div className="mt-5 rounded-xl bg-[#F1F0F8] p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#433D8B]" />
              <div>
                <p className="text-xs font-semibold text-[#17153B]">Operational exposure</p>
                <p className="mt-1 text-[10px] leading-5 text-[#68647A]">
                  {data.lowStock
                    ? `${data.lowStock} inventory records are at or below the low-stock threshold.`
                    : data.pending
                      ? `${data.pending} orders are still moving through the fulfilment flow.`
                      : "No immediate operational exception was detected from the connected data."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#E7E4EF] bg-[#17153B] p-5 text-white shadow-[0_12px_35px_rgba(23,21,59,0.08)] sm:p-6">
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#C8ACD6]">
            Nexora&apos;s read
          </p>
          <h2 className="mt-4 text-base font-semibold leading-6">{data.insight.title}</h2>
          <p className="mt-2 text-[10px] leading-5 text-white/65">{data.insight.description}</p>
          <div className="mt-5 border-t border-white/10 pt-4 text-[9px] text-[#C8ACD6]">
            {data.insight.evidence}
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-[#E7E4EF] bg-white p-5 shadow-[0_12px_35px_rgba(23,21,59,0.04)] sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#68647A]">
                Inventory
              </p>
              <h2 className="mt-1 text-sm font-semibold text-[#17153B]">Stock exposure</h2>
            </div>
            <Boxes className="h-4 w-4 text-[#433D8B]" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Mini label="Inventory records" value={data.inventoryCount.toLocaleString("en-IN")} />
            <Mini label="Inventory value" value={data.inventoryValue ? compact(data.inventoryValue, currencyCode) : "—"} />
            <Mini label="Low stock" value={data.lowStock.toLocaleString("en-IN")} />
            <Mini label="Out of stock" value={data.outOfStock.toLocaleString("en-IN")} />
          </div>
          {data.productPressure.length > 0 && (
            <div className="mt-5 border-t border-[#E7E4EF] pt-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#68647A]">
                Demand + stock pressure
              </p>
              <div className="mt-3 space-y-3">
                {data.productPressure.map((product) => (
                  <div key={product.name} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-xs font-medium text-[#17153B]">{product.name}</span>
                    <span className="shrink-0 text-[10px] text-[#68647A]">
                      {product.stock} left · {compact(product.revenue, currencyCode)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[#E7E4EF] bg-white p-5 shadow-[0_12px_35px_rgba(23,21,59,0.04)] sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#68647A]">
                Sales flow
              </p>
              <h2 className="mt-1 text-sm font-semibold text-[#17153B]">Revenue by channel</h2>
            </div>
            <ShoppingCart className="h-4 w-4 text-[#433D8B]" />
          </div>
          {data.topChannels.length ? (
            <div className="mt-5 space-y-4">
              {data.topChannels.map((channel) => {
                const max = data.topChannels[0]?.value || 1
                return (
                  <div key={channel.name}>
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-[#17153B]">{channel.name}</span>
                      <span className="text-[#68647A]">{compact(channel.value, currencyCode)}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#F1F0F8]">
                      <div
                        className="h-full rounded-full bg-[#433D8B]"
                        style={{ width: `${(channel.value / max) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="mt-5 flex min-h-28 items-center justify-center rounded-xl border border-dashed border-[#E7E4EF] bg-[#F1F0F8]/60 px-5 text-center">
              <p className="text-[10px] text-[#68647A]">Connect an orders dataset with a sales channel field.</p>
            </div>
          )}
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-[#E7E4EF] bg-white p-5 shadow-[0_12px_35px_rgba(23,21,59,0.04)] sm:p-6">
        <div className="flex items-center gap-3">
          <Truck className="h-4 w-4 text-[#433D8B]" />
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#68647A]">Suppliers</p>
            <h2 className="mt-1 text-sm font-semibold text-[#17153B]">Supply-side exposure</h2>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Mini label="Suppliers detected" value={String(data.supplierCount)} />
          <Mini label="High lead-time suppliers" value={String(data.supplierRisk)} />
          <Mini label="Orders / units" value={`${data.activeOrders} / ${data.units.toLocaleString("en-IN")}`} />
        </div>
      </section>
    </div>
  )
}

function Health({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: number
}) {
  return (
    <div className="rounded-xl border border-[#E7E4EF] bg-[#F1F0F8]/60 p-4">
      <Icon className="h-4 w-4 text-[#433D8B]" />
      <p className="mt-3 text-lg font-semibold text-[#17153B]">{value.toLocaleString("en-IN")}</p>
      <p className="mt-1 text-[10px] text-[#68647A]">{label}</p>
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E7E4EF] bg-[#F1F0F8]/60 p-4">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#68647A]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[#17153B]">{value}</p>
    </div>
  )
}
