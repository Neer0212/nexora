"use client"

import { ArrowRight, Brain, CircleAlert, Package, ShoppingCart, Sparkles, Truck, Users } from "lucide-react"

type Signal = { severity: "watch" | "positive" | "info"; title: string; detail: string; evidence: string }
type Props = { businessName: string; latestDate: string; connectedCount: number; totalCore: number; signals: Signal[]; revenue: number; lowStock: number; suppliers: number; customers: number; topProduct: string | null; currencyCode: string }

function money(value: number, currency: string) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: currency || "INR", maximumFractionDigits: 0 }).format(value) }
function iconFor(title: string) { const v = title.toLowerCase(); if (v.includes("stock")) return Package; if (v.includes("supplier")) return Truck; if (v.includes("customer")) return Users; if (v.includes("demand") || v.includes("revenue")) return ShoppingCart; return Brain }

export default function CrossModuleIntelligence({ businessName, latestDate, connectedCount, totalCore, signals, revenue, lowStock, suppliers, customers, topProduct, currencyCode }: Props) {
  const coverage = totalCore ? Math.round((connectedCount / totalCore) * 100) : 0
  return (
    <div className="min-h-screen bg-zinc-50 px-5 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 text-xs font-medium text-blue-600">Cross-module intelligence</p>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-zinc-950 lg:text-5xl">See the signals that only appear when the business connects.</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-500">Nexora correlates demand, customers, inventory, and suppliers instead of treating each dataset as an isolated report.</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 lg:min-w-[250px]"><p className="text-xs font-medium text-zinc-400">Business context</p><p className="mt-1 text-sm font-medium text-zinc-950">{businessName}</p><p className="mt-1 text-xs text-zinc-400">Data through {latestDate}</p></div>
        </header>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Revenue" value={money(revenue, currencyCode)} detail="From connected order rows" icon={ShoppingCart} />
          <Metric label="Low stock" value={lowStock ? String(lowStock) : "—"} detail={lowStock ? "At or below reorder level" : "Connect inventory data"} icon={Package} />
          <Metric label="Suppliers" value={suppliers ? String(suppliers) : "—"} detail={suppliers ? "Supplier records connected" : "Connect supplier data"} icon={Truck} />
          <Metric label="Customers" value={customers ? String(customers) : "—"} detail={customers ? "Customer records connected" : "Connect customer data"} icon={Users} />
        </section>
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.8fr)]">
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 lg:p-8">
            <div className="flex items-start justify-between gap-5 border-b border-zinc-200 pb-6"><div><p className="text-xs font-medium text-zinc-400">Nexora&apos;s read</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">What stands out across the business.</h2></div><div className="hidden rounded-xl bg-zinc-100 p-3 sm:block"><Sparkles className="h-5 w-5 text-blue-600" /></div></div>
            <div className="mt-6 space-y-3">{signals.length ? signals.map((signal) => { const Icon = iconFor(signal.title); return <article key={`${signal.title}-${signal.evidence}`} className={`rounded-2xl border p-5 ${signal.severity === "watch" ? "border-[#E8D8F0] bg-[#FAF7FC]" : signal.severity === "positive" ? "border-[#DDD8F0] bg-[#F8F7FC]" : "border-zinc-200 bg-white"}`}><div className="flex gap-4"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80"><Icon className="h-4 w-4 text-blue-600" /></div><div><div className="flex items-center gap-2"><h3 className="font-semibold text-zinc-950">{signal.title}</h3>{signal.severity === "watch" && <CircleAlert className="h-4 w-4 text-blue-600" />}</div><p className="mt-1 text-sm leading-6 text-zinc-500">{signal.detail}</p><p className="mt-3 text-xs font-medium text-blue-600">Evidence · {signal.evidence}</p></div></div></article> }) : <div className="rounded-2xl border border-dashed border-[#D9D5E4] bg-[#FAF9FC] p-8 text-center"><Brain className="mx-auto h-7 w-7 text-zinc-400" /><p className="mt-3 font-medium text-zinc-950">No cross-module signal yet.</p><p className="mt-1 text-sm text-zinc-500">Connect more business datasets so Nexora can correlate them.</p></div>}</div>
          </section>
          <aside className="space-y-5">
            <section className="rounded-3xl bg-zinc-950 p-7 text-white"><p className="text-xs font-medium text-blue-200">Context coverage</p><div className="mt-4 flex items-end justify-between gap-4"><p className="text-5xl font-semibold tracking-tight">{connectedCount}/{totalCore}</p><p className="pb-1 text-sm text-blue-200">{coverage}% connected</p></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-blue-200" style={{ width: `${coverage}%` }} /></div><p className="mt-5 text-sm leading-6 text-blue-200">More connected context gives Nexora more evidence to distinguish correlation from coincidence.</p></section>
            <section className="rounded-3xl border border-zinc-200 bg-white p-7"><p className="text-xs font-medium text-zinc-400">Worth knowing</p><h2 className="mt-2 text-xl font-semibold text-zinc-950">Strongest connected signal</h2><p className="mt-3 text-sm leading-6 text-zinc-500">{topProduct ? `${topProduct} is the strongest product signal in the latest order window.` : "Connect product data to identify the strongest product signal."}</p><div className="mt-5 flex items-center gap-2 text-sm font-medium text-blue-600">Review the evidence <ArrowRight className="h-4 w-4" /></div></section>
          </aside>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof Brain }) { return <div className="rounded-2xl border border-zinc-200 bg-white p-6"><div className="flex items-center justify-between"><p className="text-xs font-medium text-zinc-500">{label}</p><div className="rounded-xl bg-zinc-100 p-2.5"><Icon className="h-4 w-4 text-blue-600" /></div></div><p className="mt-6 text-3xl font-semibold tracking-tight text-zinc-950">{value}</p><p className="mt-2 text-xs leading-5 text-zinc-400">{detail}</p></div> }
