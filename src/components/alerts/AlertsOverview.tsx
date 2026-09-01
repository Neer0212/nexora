"use client"

import { useState } from "react"
import { BellRing, Check, CircleAlert, TrendingUp } from "lucide-react"

type Alert = { id: string; priority: "high" | "medium" | "low"; title: string; why: string; evidence: string }
export default function AlertsOverview({ alerts, latestDate }: { alerts: Alert[]; latestDate: string | null }) {
  const [read, setRead] = useState<string[]>([])
  const markRead = (id: string) => setRead((current) => current.includes(id) ? current : [...current, id])
  return <div className="min-h-full bg-[#F1F0F8] px-5 py-8 lg:px-10 lg:py-10"><div className="mx-auto max-w-[1200px]">
    <header className="mb-8"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#433D8B]">Alerts & monitoring</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] text-[#17153B]">Know when something changes.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#68647A]">These alerts are generated from the same verified signals used by Business Brain. Data through {latestDate ?? "the latest connected rows"}.</p></header>
    <div className="space-y-3">{alerts.map((alert) => { const isRead=read.includes(alert.id); const Icon=alert.priority==="high"?CircleAlert:alert.priority==="medium"?BellRing:TrendingUp; return <article key={alert.id} className={`rounded-2xl border p-5 transition ${isRead ? "border-[#E7E4EF] bg-white/70" : "border-[#D9D1E5] bg-white shadow-[0_10px_30px_rgba(23,21,59,0.04)]"}`}><div className="flex gap-4"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0EEF6] text-[#433D8B]"><Icon className="h-4 w-4"/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><h2 className="text-sm font-semibold text-[#17153B]">{alert.title}</h2><span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#9A94A8]">{alert.priority}</span></div>{isRead?<span className="inline-flex items-center gap-1 text-[10px] text-[#9A94A8]"><Check className="h-3.5 w-3.5"/> Read</span>:<button onClick={()=>markRead(alert.id)} className="rounded-lg border border-[#E7E4EF] px-3 py-1.5 text-[10px] font-medium text-[#68647A] hover:bg-[#F1F0F8]">Mark read</button>}</div><p className="mt-2 text-sm leading-6 text-[#68647A]">{alert.why}</p><p className="mt-2 text-[10px] font-medium text-[#433D8B]">Evidence · {alert.evidence}</p></div></div></article> })}</div>
  </div></div>
}
