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
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-500">
          {label}
        </p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 text-blue-600">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-5 text-2xl font-semibold tracking-tight text-zinc-950">
        {value}
      </p>
      <p className="mt-1 text-[10px] text-zinc-500">{detail}</p>
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
          <p className="text-xs font-medium text-blue-600">
            Operations intelligence
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Keep the business moving.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Nexora connects demand, inventory and suppliers to surface operational pressure before it becomes a problem.
          </p>
          <p className="mt-2 text-[10px] text-zinc-400">
            {businessName}{data.latestDate ? ` · Data through ${data.latestDate}` : ""}
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

      {!hasOperations && (
        <div className="mt-7 rounded-2xl border border-dashed border-blue-200 bg-white p-6 text-sm text-zinc-500">
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
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500">
                Fulfilment health
              </p>
              <h2 className="mt-1 text-sm font-semibold text-zinc-950">
                Where attention is needed
              </h2>
            </div>
            <PackageSearch className="h-4 w-4 text-blue-600" />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Health icon={CheckCircle2} label="Active orders" value={data.activeOrders} />
            <Health icon={Clock3} label="Pending" value={data.pending} />
            <Health icon={RotateCcw} label="Returned / cancelled" value={data.cancelled} />
          </div>

          <div className="mt-5 rounded-xl bg-zinc-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <div>
                <p className="text-xs font-semibold text-zinc-950">Operational exposure</p>
                <p className="mt-1 text-[10px] leading-5 text-zinc-500">
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

        <section className="rounded-2xl border border-zinc-200 bg-zinc-950 p-5 text-white shadow-sm sm:p-6">
          <p className="text-xs font-medium text-blue-200">
            Nexora&apos;s read
          </p>
          <h2 className="mt-4 text-base font-semibold leading-6">{data.insight.title}</h2>
          <p className="mt-2 text-[10px] leading-5 text-white/65">{data.insight.description}</p>
          <div className="mt-5 border-t border-white/10 pt-4 text-[9px] text-blue-200">
            {data.insight.evidence}
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500">
                Inventory
              </p>
              <h2 className="mt-1 text-sm font-semibold text-zinc-950">Stock exposure</h2>
            </div>
            <Boxes className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Mini label="Inventory records" value={data.inventoryCount.toLocaleString("en-IN")} />
            <Mini label="Inventory value" value={data.inventoryValue ? compact(data.inventoryValue, currencyCode) : "—"} />
            <Mini label="Low stock" value={data.lowStock.toLocaleString("en-IN")} />
            <Mini label="Out of stock" value={data.outOfStock.toLocaleString("en-IN")} />
          </div>
          {data.productPressure.length > 0 && (
            <div className="mt-5 border-t border-zinc-200 pt-4">
              <p className="text-xs font-medium text-zinc-500">
                Demand + stock pressure
              </p>
              <div className="mt-3 space-y-3">
                {data.productPressure.map((product) => (
                  <div key={product.name} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-xs font-medium text-zinc-950">{product.name}</span>
                    <span className="shrink-0 text-[10px] text-zinc-500">
                      {product.stock} left · {compact(product.revenue, currencyCode)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500">
                Sales flow
              </p>
              <h2 className="mt-1 text-sm font-semibold text-zinc-950">Revenue by channel</h2>
            </div>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </div>
          {data.topChannels.length ? (
            <div className="mt-5 space-y-4">
              {data.topChannels.map((channel) => {
                const max = data.topChannels[0]?.value || 1
                return (
                  <div key={channel.name}>
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-zinc-950">{channel.name}</span>
                      <span className="text-zinc-500">{compact(channel.value, currencyCode)}</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-50">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${(channel.value / max) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="mt-5 flex min-h-28 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 px-5 text-center">
              <p className="text-[10px] text-zinc-500">Connect an orders dataset with a sales channel field.</p>
            </div>
          )}
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <Truck className="h-4 w-4 text-blue-600" />
          <div>
            <p className="text-xs font-medium text-zinc-500">Suppliers</p>
            <h2 className="mt-1 text-sm font-semibold text-zinc-950">Supply-side exposure</h2>
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
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
      <Icon className="h-4 w-4 text-blue-600" />
      <p className="mt-3 text-lg font-semibold text-zinc-950">{value.toLocaleString("en-IN")}</p>
      <p className="mt-1 text-[10px] text-zinc-500">{label}</p>
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-zinc-950">{value}</p>
    </div>
  )
}
