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
    <div className="rounded-2xl border border-[#E7E4EF] bg-white p-5 shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#68647A]">
          {label}
        </p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F1F0F8] text-[#433D8B]">
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <p className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-[#17153B]">
        {value}
      </p>

      <p className="mt-1 text-[10px] text-[#68647A]">{detail}</p>
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#433D8B]">
            Finance intelligence
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[#17153B] sm:text-4xl">
            Know where the money goes.
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68647A]">
            Revenue, costs, margins, and profitability calculated from the data connected to Nexora.
          </p>
        </div>

        <Link
          href="/data-hub"
          className="group inline-flex w-fit items-center gap-2 rounded-xl bg-[#17153B] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[#2E236C]"
        >
          Connect finance data
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {!data.hasRevenue && (
        <section className="mt-7 rounded-2xl border border-[#C8ACD6]/40 bg-white p-6">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C8ACD6]/25 text-[#433D8B]">
              <DollarSign className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-semibold text-[#17153B]">
                Finance is waiting for connected numbers.
              </p>

              <p className="mt-1 max-w-2xl text-xs leading-5 text-[#68647A]">
                Connect an orders or finance dataset with revenue, COGS, or expense fields.
                Nexora will calculate the rest without inventing values.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
        <section className="overflow-hidden rounded-2xl border border-[#E7E4EF] bg-white shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <div className="border-b border-[#E7E4EF] px-5 py-5 sm:px-6">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#68647A]">
              Financial movement
            </p>
            <h2 className="mt-1 text-sm font-semibold text-[#17153B]">
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
                          className="w-full rounded-t-md bg-[#433D8B]/55 transition group-hover:bg-[#2E236C]"
                          style={{ height: `${Math.max(revenueHeight, 3)}%` }}
                        />
                      </div>
                    )
                  })}
                </div>

                <div className="mt-3 flex justify-between text-[8px] uppercase tracking-[0.12em] text-[#68647A]">
                  <span>{data.trend[0]?.label}</span>
                  <span>{data.trend.at(-1)?.label}</span>
                </div>
              </>
            ) : (
              <Empty text="Connect revenue data to see the financial trend." />
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[#E7E4EF] bg-white shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <div className="border-b border-[#E7E4EF] px-5 py-5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#68647A]">
              Nexora&apos;s read
            </p>
            <h2 className="mt-1 text-sm font-semibold text-[#17153B]">
              Financial signal
            </h2>
          </div>

          <div className="p-5">
            <div className="rounded-xl bg-[#17153B] p-5 text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C8ACD6]/20 text-[#C8ACD6]">
                <Brain className="h-4 w-4" />
              </div>

              <h3 className="mt-4 text-sm font-semibold leading-5">
                {data.insight.title}
              </h3>

              <p className="mt-2 text-[10px] leading-5 text-white/65">
                {data.insight.description}
              </p>

              <div className="mt-4 border-t border-white/10 pt-3 text-[9px] text-[#C8ACD6]">
                {data.insight.evidence}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-[#E7E4EF] bg-white p-5 shadow-[0_12px_35px_rgba(23,21,59,0.04)] sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#68647A]">
                Expenses
              </p>
              <h2 className="mt-1 text-sm font-semibold text-[#17153B]">
                Where operating costs sit
              </h2>
            </div>
            <ReceiptText className="h-4 w-4 text-[#433D8B]" />
          </div>

          {data.expenseBreakdown.length ? (
            <div className="mt-5 space-y-4">
              {data.expenseBreakdown.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="min-w-0 truncate font-medium text-[#17153B]">
                      {item.name}
                    </span>
                    <span className="shrink-0 text-[#68647A]">
                      {compactMoney(item.value, data.currencyCode)}
                    </span>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#F1F0F8]">
                    <div
                      className="h-full rounded-full bg-[#433D8B]"
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

        <section className="rounded-2xl border border-[#E7E4EF] bg-white p-5 shadow-[0_12px_35px_rgba(23,21,59,0.04)] sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#68647A]">
                Period comparison
              </p>
              <h2 className="mt-1 text-sm font-semibold text-[#17153B]">
                Latest 30 days vs previous 30
              </h2>
            </div>

            {data.revenueChange !== null ? (
              data.revenueChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-[#433D8B]" />
              ) : (
                <TrendingDown className="h-4 w-4 text-[#68647A]" />
              )
            ) : (
              <BarChart3 className="h-4 w-4 text-[#433D8B]" />
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#F1F0F8] p-4">
              <p className="text-[9px] uppercase tracking-[0.12em] text-[#68647A]">
                Current revenue
              </p>
              <p className="mt-2 text-lg font-semibold text-[#17153B]">
                {compactMoney(data.currentRevenue, data.currencyCode)}
              </p>
            </div>

            <div className="rounded-xl bg-[#F1F0F8] p-4">
              <p className="text-[9px] uppercase tracking-[0.12em] text-[#68647A]">
                Previous revenue
              </p>
              <p className="mt-2 text-lg font-semibold text-[#17153B]">
                {compactMoney(data.previousRevenue, data.currencyCode)}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#E7E4EF] p-4">
            {data.revenueChange !== null ? (
              <>
                {data.revenueChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-[#433D8B]" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-[#68647A]" />
                )}
                <p className="text-xs font-medium text-[#17153B]">
                  {data.revenueChange >= 0 ? "+" : ""}
                  {data.revenueChange.toFixed(1)}% revenue change
                </p>
              </>
            ) : (
              <p className="text-xs text-[#68647A]">
                Not enough dated data for a period comparison.
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-2xl border border-[#E7E4EF] bg-white p-5 shadow-[0_12px_35px_rgba(23,21,59,0.04)] sm:p-6">
        <div className="flex items-center gap-2">
          <CircleAlert className="h-4 w-4 text-[#433D8B]" />
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#68647A]">
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
    <div className="rounded-xl border border-[#E7E4EF] bg-[#F1F0F8]/60 p-4">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#68647A]">
        {label}
      </p>
      <p className="mt-3 text-lg font-semibold text-[#17153B]">{value}</p>
      <p className="mt-1 text-[10px] leading-5 text-[#68647A]">{detail}</p>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-[#E7E4EF] bg-[#F1F0F8]/55 px-5 text-center">
      <p className="text-[10px] leading-5 text-[#68647A]">{text}</p>
    </div>
  )
}
