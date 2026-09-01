"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Clock3, Lightbulb, RotateCcw } from "lucide-react"

type Signal = { id: string; priority: "high" | "medium" | "low"; title: string; why: string; action: string; evidence: string }

function getInvestigateLink(id: string) {
  if (id.includes("inventory")) return "/inventory"
  if (id.includes("supplier")) return "/suppliers"
  if (id.includes("revenue")) return "/autopsy"
  if (id.includes("returns")) return "/changes"
  return "/changes"
}
type Props = { signals: Signal[]; businessName: string }

export default function ActionsOverview({ signals, businessName }: Props) {
  const [status, setStatus] = useState<Record<string, "new" | "in-progress" | "done" | "dismissed">>({})
  const active = useMemo(() => signals.filter((s) => status[s.id] !== "dismissed"), [signals, status])
  const openCount = active.filter((s) => status[s.id] !== "done").length

  return (
    <div className="min-h-full bg-[#F1F0F8] px-5 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#433D8B]">Action center</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] text-[#17153B]">Turn signals into decisions.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#68647A]">{businessName} has {openCount} open recommendation{openCount === 1 ? "" : "s"} based on connected data.</p></div>
          <div className="rounded-2xl border border-[#E7E4EF] bg-white px-5 py-4"><p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#9A94A8]">Action status</p><p className="mt-1 text-2xl font-semibold text-[#17153B]">{openCount}</p><p className="text-[10px] text-[#68647A]">open items</p></div>
        </header>
        <div className="space-y-4">
          {active.map((signal) => {
            const current = status[signal.id] ?? "new"
            return <article key={signal.id} className="rounded-2xl border border-[#E7E4EF] bg-white p-5 shadow-[0_12px_35px_rgba(23,21,59,0.04)] sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex gap-4"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${signal.priority === "high" ? "bg-[#17153B] text-white" : "bg-[#F0EEF6] text-[#433D8B]"}`}><Lightbulb className="h-5 w-5" /></div>
                  <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-semibold text-[#17153B]">{signal.title}</h2><span className="rounded-full bg-[#F1F0F8] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#68647A]">{signal.priority}</span></div><p className="mt-2 text-sm leading-6 text-[#68647A]">{signal.why}</p><div className="mt-3 text-xs font-medium text-[#433D8B]">Evidence · {signal.evidence}</div><div className="mt-2"><Link href={getInvestigateLink(signal.id)} className="text-[13px] font-medium text-[#433D8B] hover:underline">Investigate →</Link></div></div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {current === "done" ? <button onClick={() => setStatus((v) => ({...v, [signal.id]: "new"}))} className="inline-flex items-center gap-2 rounded-lg border border-[#E7E4EF] px-3 py-2 text-xs text-[#68647A]"><RotateCcw className="h-3.5 w-3.5" /> Reopen</button> : <button onClick={() => setStatus((v) => ({...v, [signal.id]: "done"}))} className="inline-flex items-center gap-2 rounded-lg bg-[#17153B] px-3 py-2 text-xs font-medium text-white hover:bg-[#2E236C]"><CheckCircle2 className="h-3.5 w-3.5" /> Mark done</button>}
                  {current !== "done" && <button onClick={() => setStatus((v) => ({...v, [signal.id]: "dismissed"}))} className="rounded-lg border border-[#E7E4EF] px-3 py-2 text-xs text-[#68647A]">Dismiss</button>}
                </div>
              </div>
              <div className="mt-5 grid gap-3 border-t border-[#E7E4EF] pt-5 md:grid-cols-[1fr_auto] md:items-center"><div><p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#9A94A8]">Recommended action</p><p className="mt-1 text-sm font-medium text-[#17153B]">{signal.action}</p></div><div className="flex items-center gap-2 text-[10px] text-[#68647A]"><Clock3 className="h-3.5 w-3.5" /> Status: {current.replace("-", " ")}</div></div>
            </article>
          })}
        </div>
        <div className="mt-6 rounded-2xl border border-[#E7E4EF] bg-white p-5 text-sm text-[#68647A]"><span className="font-medium text-[#17153B]">How this works:</span> actions are generated from Nexora&apos;s deterministic business signals. Nothing here is invented or hidden behind a black box.</div>
      </div>
    </div>
  )
}
