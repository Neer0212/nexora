"use client"

import { useMemo, useState, useTransition } from "react"
import { CheckCircle2, Target, TrendingDown, TrendingUp, Check } from "lucide-react"

const defaults = [
  { id: "revenue", label: "Monthly revenue", target: 1000000, unit: "currency" },
  { id: "orders", label: "Monthly orders", target: 500, unit: "number" },
  { id: "customers", label: "Customers", target: 100, unit: "number" },
  { id: "low-stock", label: "Low-stock records", target: 5, unit: "number", inverse: true },
]

type Props = {
  revenue: number
  orders: number
  customers: number
  lowStock: number
  currencyCode: string
  latestDate: string | null
  savedTargets: Record<string, number>
  onSaveGoal: (goalKey: string, target: number) => Promise<void>
}

export default function GoalsOverview({ revenue, orders, customers, lowStock, currencyCode, latestDate, savedTargets, onSaveGoal }: Props) {
  const [targets, setTargets] = useState<Record<string, number>>(() => Object.fromEntries(defaults.map((goal) => [goal.id, savedTargets[goal.id] ?? goal.target])))
  const [saving, startSaving] = useTransition()
  const [savedKey, setSavedKey] = useState<string | null>(null)
  const actuals: Record<string, number> = { revenue, orders, customers, "low-stock": lowStock }
  const format = (value: number, unit: string) => unit === "currency" ? new Intl.NumberFormat("en-IN", { style: "currency", currency: currencyCode || "INR", maximumFractionDigits: 0 }).format(value) : value.toLocaleString("en-IN")
  const completed = useMemo(() => defaults.filter((goal) => goal.inverse ? actuals[goal.id] <= targets[goal.id] : actuals[goal.id] >= targets[goal.id]).length, [actuals, targets])

  const handleSave = (goalKey: string) => {
    const target = targets[goalKey]
    startSaving(async () => {
      await onSaveGoal(goalKey, target)
      setSavedKey(goalKey)
      window.setTimeout(() => setSavedKey(null), 1600)
    })
  }

  return <div className="min-h-full bg-[#F1F0F8] px-5 py-8 lg:px-10 lg:py-10"><div className="mx-auto max-w-[1250px]"><header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#433D8B]">Goals & targets</p><h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] text-[#17153B]">Give the business something to aim for.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#68647A]">Compare current connected performance with the targets that matter. Data through {latestDate ?? "the latest connected rows"}.</p></div><div className="rounded-2xl border border-[#E7E4EF] bg-white px-5 py-4"><p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#9A94A8]">On target</p><p className="mt-1 text-2xl font-semibold text-[#17153B]">{completed}/{defaults.length}</p></div></header><div className="grid gap-4 md:grid-cols-2">{defaults.map((goal) => { const actual=actuals[goal.id]; const target=targets[goal.id]; const progress=goal.inverse ? Math.min(100,(target/Math.max(actual,1))*100) : Math.min(100,(actual/Math.max(target,1))*100); const good=goal.inverse ? actual<=target : actual>=target; return <article key={goal.id} className="rounded-2xl border border-[#E7E4EF] bg-white p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#9A94A8]">{goal.label}</p><p className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[#17153B]">{format(actual,goal.unit)}</p><p className="mt-1 text-xs text-[#9A94A8]">Target · {format(target,goal.unit)}</p></div><div className={`rounded-xl p-3 ${good ? "bg-[#F0EEF6] text-[#433D8B]" : "bg-[#FAF7FC] text-[#433D8B]"}`}>{good?<CheckCircle2 className="h-5 w-5"/>:goal.inverse?<TrendingDown className="h-5 w-5"/>:<TrendingUp className="h-5 w-5"/>}</div></div><div className="mt-6 h-2 overflow-hidden rounded-full bg-[#F1F0F8]"><div className="h-full rounded-full bg-[#433D8B]" style={{width:`${progress}%`}}/></div><div className="mt-5 flex items-center gap-3"><Target className="h-4 w-4 text-[#9A94A8]"/><input type="number" min="0" value={target} onChange={(e)=>setTargets((current)=>({...current,[goal.id]:Number(e.target.value)}))} className="w-full rounded-lg border border-[#E7E4EF] bg-[#FAF9FC] px-3 py-2 text-sm text-[#17153B] outline-none focus:border-[#433D8B]"/><button type="button" onClick={()=>handleSave(goal.id)} disabled={saving} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#433D8B] px-3 py-2 text-xs font-medium text-white transition-opacity disabled:opacity-60">{savedKey===goal.id?<Check className="h-3.5 w-3.5"/>:"Save"}{savedKey===goal.id?"Saved":""}</button></div></article> })}</div><p className="mt-6 text-[10px] leading-5 text-[#9A94A8]">Changes are saved to this business workspace and restored automatically when you return.</p></div></div>
}
