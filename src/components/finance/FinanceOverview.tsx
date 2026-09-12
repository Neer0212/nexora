"use client"

import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  Brain,
  CircleAlert,
  DollarSign,
  Percent,
  ReceiptText,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import type { ElementType } from "react"

type TrendPoint = {
  label: string
  revenue: number
  profit: number
}

type Breakdown = {
  name: string
  value: number
}

type Insight = {
  title: string
  description: string
  evidence: string
}

type FinanceData = {
  businessName: string
  currencyCode: string
  hasRevenue: boolean
  hasFinanceFields: boolean
  revenue: number
  cogs: number
  operatingExpenses: number
  grossProfit: number
  grossMargin: number | null
  netProfit: number
  netMargin: number | null
  currentRevenue: number
  previousRevenue: number
  revenueChange: number | null
  currentGrossProfit: number
  currentGrossMargin: number | null
  currentNetProfit: number
  trend: TrendPoint[]
  expenseBreakdown: Breakdown[]
  connectedDatasets: number
  financeRows: number
  orderRows: number
  insight: Insight
}

function money(value: number, code: string) {
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

function compactMoney(value: number, code: string) {
  const prefix = code === "INR" ? "₹" : `${code} `

  if (Math.abs(value) >= 10_000_000) {
    return `${prefix}${(value / 10_000_000).toFixed(1)}Cr`
  }

  if (Math.abs(value) >= 100_000) {
    return `${prefix}${(value / 100_000).toFixed(1)}L`
  }

  if (Math.abs(value) >= 1_000) {
    return `${prefix}${(value / 1_000).toFixed(1)}K`
  }

  return `${prefix}${Math.round(value).toLocaleString("en-IN")}`
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

export default function FinanceOverview({
  data,
}: {
  data: FinanceData
}) {
  const maxTrend = Math.max(
    ...data.trend.map((point) => Math.max(Math.abs(point.revenue), Math.abs(point.profit))),
    1
  )

  const maxExpense = Math.max(
    ...data.expenseBreakdown.map((item) => item.value),
    1
  )

  return (
    <div className="w-full">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium text-blue-600">
            Finance intelligence
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Know where the money goes.
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Revenue, costs, margins, and profitability calculated from the data connected to Nexora.
          </p>
        </div>

        <Link
          href="/data-hub"
          className="group inline-flex w-fit items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-xs font-medium text-white transition hover:bg-blue-800"
        >
          Connect finance data
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {!data.hasRevenue && (
        <section className="mt-7 rounded-2xl border border-blue-200/40 bg-white p-6">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-200/25 text-blue-600">
              <DollarSign className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-semibold text-zinc-950">
                Finance is waiting for connected numbers.
              </p>

              <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-500">
                Connect an orders or finance dataset with revenue, COGS, or expense fields.
                Nexora will calculate the rest without inventing values.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="mt-7 grid grid-cols-1 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200">
        <Metric
          label="Revenue"
          value={data.hasRevenue ? compactMoney(data.revenue, data.currencyCode) : "—"}
          detail={`${data.orderRows.toLocaleString("en-IN")} order rows detected`}
          icon={DollarSign}
        />

        <Metric
          label="Gross profit"
          value={data.hasFinanceFields ? compactMoney(data.grossProfit, data.currencyCode) : "—"}
          detail={
            data.grossMargin !== null
              ? `${data.grossMargin.toFixed(1)}% gross margin`
              : "Connect COGS to calculate"
          }
          icon={TrendingUp}
        />

        <Metric
          label="Operating expenses"
          value={
            data.hasFinanceFields
              ? compactMoney(data.operatingExpenses, data.currencyCode)
              : "—"
          }
          detail={
            data.hasFinanceFields
              ? "Connected operating costs"
              : "Connect expense data"
          }
          icon={ReceiptText}
        />

        <Metric
          label="Net profit"
          value={data.hasFinanceFields ? compactMoney(data.netProfit, data.currencyCode) : "—"}
          detail={
            data.netMargin !== null
              ? `${data.netMargin.toFixed(1)}% net margin`
              : "Requires COGS + expenses"
          }
          icon={Percent}
        />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-5 py-5 sm:px-6">
            <p className="text-xs font-medium text-zinc-500">
              Financial movement
            </p>
            <h2 className="mt-1 text-sm font-semibold text-zinc-950">
              Latest 30 days
            </h2>
          </div>

          <div className="px-5 pb-6 pt-7 sm:px-6">
            {data.trend.some((point) => point.revenue !== 0) ? (
              <>
                <div className="flex h-56 items-end gap-1 sm:gap-1.5">
                  {data.trend.map((point, index) => {
                    const revenueHeight = (Math.abs(point.revenue) / maxTrend) * 100

                    return (
                      <div
                        key={`${point.label}-${index}`}
                        className="group flex h-full min-w-0 flex-1 flex-col justify-end"
                        title={`${point.label}: ${money(point.revenue, data.currencyCode)}`}
                      >
                        <div
                          className="w-full rounded-t-md bg-blue-600/55 transition group-hover:bg-blue-800"
                          style={{ height: `${Math.max(revenueHeight, 3)}%` }}
                        />
                      </div>
                    )
                  })}
                </div>

                <div className="mt-3 flex justify-between text-xs font-medium text-zinc-500">
                  <span>{data.trend[0]?.label}</span>
                  <span>{data.trend.at(-1)?.label}</span>
                </div>
              </>
            ) : (
              <Empty text="Connect revenue data to see the financial trend." />
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-5 py-5">
            <p className="text-xs font-medium text-zinc-500">
              Nexora&apos;s read
            </p>
            <h2 className="mt-1 text-sm font-semibold text-zinc-950">
              Financial signal
            </h2>
          </div>

          <div className="p-5">
            <div className="rounded-xl bg-zinc-950 p-5 text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-200/20 text-blue-200">
                <Brain className="h-4 w-4" />
              </div>

              <h3 className="mt-4 text-sm font-semibold leading-5">
                {data.insight.title}
              </h3>

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

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500">
                Expenses
              </p>
              <h2 className="mt-1 text-sm font-semibold text-zinc-950">
                Where operating costs sit
              </h2>
            </div>
            <ReceiptText className="h-4 w-4 text-blue-600" />
          </div>

          {data.expenseBreakdown.length ? (
            <div className="mt-5 space-y-4">
              {data.expenseBreakdown.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="min-w-0 truncate font-medium text-zinc-950">
                      {item.name}
                    </span>
                    <span className="shrink-0 text-zinc-500">
                      {compactMoney(item.value, data.currencyCode)}
                    </span>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-50">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${(item.value / maxExpense) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty text="Expense categories will appear when Nexora detects expense data." />
          )}
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500">
                Period comparison
              </p>
              <h2 className="mt-1 text-sm font-semibold text-zinc-950">
                Latest 30 days vs previous 30
              </h2>
            </div>

            {data.revenueChange !== null ? (
              data.revenueChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-blue-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-zinc-500" />
              )
            ) : (
              <BarChart3 className="h-4 w-4 text-blue-600" />
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-zinc-50 p-4">
              <p className="text-xs font-medium text-zinc-500">
                Current revenue
              </p>
              <p className="mt-2 text-lg font-semibold text-zinc-950">
                {compactMoney(data.currentRevenue, data.currencyCode)}
              </p>
            </div>

            <div className="rounded-xl bg-zinc-50 p-4">
              <p className="text-xs font-medium text-zinc-500">
                Previous revenue
              </p>
              <p className="mt-2 text-lg font-semibold text-zinc-950">
                {compactMoney(data.previousRevenue, data.currencyCode)}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-xl border border-zinc-200 p-4">
            {data.revenueChange !== null ? (
              <>
                {data.revenueChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-zinc-500" />
                )}
                <p className="text-xs font-medium text-zinc-950">
                  {data.revenueChange >= 0 ? "+" : ""}
                  {data.revenueChange.toFixed(1)}% revenue change
                </p>
              </>
            ) : (
              <p className="text-xs text-zinc-500">
                Not enough dated data for a period comparison.
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <CircleAlert className="h-4 w-4 text-blue-600" />
          <p className="text-xs font-medium text-zinc-500">
            Finance coverage
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Coverage
            label="Ready datasets"
            value={data.connectedDatasets.toString()}
            detail="Available to the finance layer"
          />
          <Coverage
            label="Finance rows"
            value={data.financeRows.toLocaleString("en-IN")}
            detail="Rows with explicit cost or expense fields"
          />
          <Coverage
            label="Orders"
            value={data.orderRows.toLocaleString("en-IN")}
            detail="Revenue-bearing order rows detected"
          />
        </div>
      </section>
    </div>
  )
}

function Coverage({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
      <p className="text-xs font-medium text-zinc-500">
        {label}
      </p>
      <p className="mt-3 text-lg font-semibold text-zinc-950">{value}</p>
      <p className="mt-1 text-[10px] leading-5 text-zinc-500">{detail}</p>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/55 px-5 text-center">
      <p className="text-[10px] leading-5 text-zinc-500">{text}</p>
    </div>
  )
}
