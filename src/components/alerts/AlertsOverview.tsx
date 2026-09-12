"use client"

import { useState } from "react"
import Link from "next/link"
import { BellRing, Check, CircleAlert, TrendingUp } from "lucide-react"

type Alert = { id: string; priority: "high" | "medium" | "low"; title: string; why: string; evidence: string }

function getInvestigateLink(id: string) {
  if (id.includes("inventory")) return "/inventory"
  if (id.includes("supplier")) return "/suppliers"
  if (id.includes("revenue")) return "/autopsy"
  if (id.includes("returns")) return "/changes"
  return "/changes"
}

export default function AlertsOverview({ alerts, latestDate }: { alerts: Alert[]; latestDate: string | null }) {
  const [read, setRead] = useState<string[]>([])
  const markRead = (id: string) => setRead((current) => current.includes(id) ? current : [...current, id])
  return <div className="min-h-full bg-zinc-50 px-5 py-8 lg:px-10 lg:py-10"><div className="mx-auto max-w-[1200px]">
    <header className="mb-8"><p className="text-xs font-medium text-blue-600">Alerts & monitoring</p><h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">Know when something changes.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">These alerts are generated from the same verified signals used by Business Brain. Data through {latestDate ?? "the latest connected rows"}.</p></header>
    <div className="space-y-3">{alerts.map((alert) => { const isRead=read.includes(alert.id); const Icon=alert.priority==="high"?CircleAlert:alert.priority==="medium"?BellRing:TrendingUp; const linkUrl = getInvestigateLink(alert.id); return <article key={alert.id} className={`rounded-2xl border p-5 transition ${isRead ? "border-zinc-200 bg-white/70" : "border-[#D9D1E5] bg-white shadow-sm"}`}><div className="flex gap-4"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-blue-600"><Icon className="h-4 w-4"/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><h2 className="text-sm font-semibold text-zinc-950">{alert.title}</h2><span className="text-xs font-medium text-zinc-400">{alert.priority}</span></div>{isRead?<span className="inline-flex items-center gap-1 text-[10px] text-zinc-400"><Check className="h-3.5 w-3.5"/> Read</span>:<button onClick={()=>markRead(alert.id)} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-[10px] font-medium text-zinc-500 hover:bg-zinc-50">Mark read</button>}</div><p className="mt-2 text-sm leading-6 text-zinc-500">{alert.why}</p><div className="mt-2 text-[10px] font-medium text-blue-600">Evidence · {alert.evidence}</div><div className="mt-3 border-t border-zinc-200 pt-3"><p className="text-xs font-medium text-blue-600 mb-2">Recommended next step</p><Link href={linkUrl} className="text-[13px] font-medium text-blue-600 hover:underline">Investigate →</Link></div></div></div></article> })}</div>
  </div></div>
}
