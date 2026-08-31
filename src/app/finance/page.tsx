import { redirect } from "next/navigation"

import Breadcrumbs from "@/components/layout/Breadcrumbs"
import FinanceOverview from "@/components/finance/FinanceOverview"
import { createClient } from "@/lib/supabase/server"

type JsonRow = Record<string, unknown>
type StoredRow = {
  dataset_id: string
  row_number: number
  row_data: unknown
}

function textValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim()
}

function numberValue(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (typeof value === "string") {
    const cleaned = value.replace(/[₹$€£,%\s]/g, "")
    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function findKey(row: JsonRow, aliases: string[]) {
  const keys = Object.keys(row)
  const normalized = new Map(
    keys.map((key) => [key.toLowerCase().replace(/[\s_-]+/g, ""), key])
  )

  for (const alias of aliases) {
    const key = normalized.get(alias.toLowerCase().replace(/[\s_-]+/g, ""))
    if (key) return key
  }

  return null
}

function parseDate(value: unknown) {
  const text = textValue(value)
  if (!text) return null

  const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (match) {
    return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`
  }

  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime())
    ? null
    : parsed.toISOString().slice(0, 10)
}

function addDays(date: string, days: number) {
  const result = new Date(`${date}T00:00:00`)
  result.setDate(result.getDate() + days)
  return result.toISOString().slice(0, 10)
}

function labelForDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${date}T00:00:00`))
}

function percentageChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? null : 0
  return ((current - previous) / Math.abs(previous)) * 100
}

function isExcludedStatus(value: unknown) {
  const status = textValue(value).toLowerCase()
  return ["cancelled", "canceled", "returned", "refunded"].includes(status)
}

export default async function FinancePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: membership, error: membershipError } = await supabase
    .from("business_users")
    .select("business_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  if (membershipError) throw new Error(membershipError.message)
  if (!membership) redirect("/onboarding")

  const [{ data: business, error: businessError }, { data: datasets, error: datasetsError }] =
    await Promise.all([
      supabase
        .from("businesses")
        .select("id, name, currency_code")
        .eq("id", membership.business_id)
        .single(),
      supabase
        .from("datasets")
        .select("id, name, file_name, row_count, status, created_at")
        .eq("business_id", membership.business_id)
        .eq("status", "ready")
        .order("created_at", { ascending: false }),
    ])

  if (businessError || !business) {
    throw new Error(businessError?.message || "Business could not be loaded.")
  }
  if (datasetsError) throw new Error(datasetsError.message)

  const readyDatasets = datasets ?? []
  const datasetIds = readyDatasets.map((dataset) => dataset.id)

  const { data: storedRows, error: rowsError } = datasetIds.length
    ? await supabase
        .from("dataset_rows")
        .select("dataset_id, row_number, row_data")
        .eq("business_id", membership.business_id)
        .in("dataset_id", datasetIds)
        .order("row_number", { ascending: true })
    : { data: [], error: null }

  if (rowsError) throw new Error(rowsError.message)

  const rows = ((storedRows ?? []) as StoredRow[]).map((item) => ({
    datasetId: item.dataset_id,
    rowNumber: item.row_number,
    row: (item.row_data ?? {}) as JsonRow,
  }))

  const orderRows = rows.filter(({ row }) =>
    Boolean(
      findKey(row, ["order_id", "orderid", "order"]) &&
        findKey(row, ["revenue", "sales", "amount", "total"])
    )
  )

  const financeRows = rows.filter(({ row }) =>
    Boolean(
      findKey(row, ["cogs", "cost_of_goods_sold", "cost_of_goods"]) ||
        findKey(row, ["operating_expenses", "operating_expense", "opex"]) ||
        findKey(row, ["expense", "expenses"])
    )
  )

  const sourceRows = financeRows.length ? financeRows : orderRows

  const revenueKey = sourceRows[0]
    ? findKey(sourceRows[0].row, ["revenue", "sales", "amount", "total"])
    : null
  const cogsKey = sourceRows[0]
    ? findKey(sourceRows[0].row, [
        "cogs",
        "cost_of_goods_sold",
        "cost_of_goods",
        "cost",
        "product_cost",
      ])
    : null
  const opexKey = sourceRows[0]
    ? findKey(sourceRows[0].row, [
        "operating_expenses",
        "operating_expense",
        "opex",
        "operating_cost",
      ])
    : null
  const expenseKey = sourceRows[0]
    ? findKey(sourceRows[0].row, ["expense", "expenses"])
    : null
  const dateKey = sourceRows[0]
    ? findKey(sourceRows[0].row, [
        "date",
        "order_date",
        "transaction_date",
        "invoice_date",
        "period",
      ])
    : null
  const categoryKey = sourceRows[0]
    ? findKey(sourceRows[0].row, [
        "expense_category",
        "expense_type",
        "category",
        "type",
      ])
    : null
  const statusKey = sourceRows[0]
    ? findKey(sourceRows[0].row, ["order_status", "status"])
    : null

  const validRows = sourceRows.filter(({ row }) => !isExcludedStatus(statusKey ? row[statusKey] : ""))

  const revenue = validRows.reduce(
    (sum, item) => sum + (revenueKey ? numberValue(item.row[revenueKey]) : 0),
    0
  )

  const cogs = validRows.reduce(
    (sum, item) => sum + (cogsKey ? numberValue(item.row[cogsKey]) : 0),
    0
  )

  const operatingExpenses = validRows.reduce((sum, item) => {
    if (opexKey) return sum + numberValue(item.row[opexKey])
    if (expenseKey) return sum + numberValue(item.row[expenseKey])
    return sum
  }, 0)

  const grossProfit = revenue - cogs
  const grossMargin = revenue ? (grossProfit / revenue) * 100 : null
  const netProfit = grossProfit - operatingExpenses
  const netMargin = revenue ? (netProfit / revenue) * 100 : null

  const datedRows = validRows
    .map((item) => ({
      ...item,
      date: dateKey ? parseDate(item.row[dateKey]) : null,
    }))
    .filter((item): item is typeof item & { date: string } => Boolean(item.date))

  const dates = datedRows.map((item) => item.date).sort()
  const latestDate = dates.at(-1) ?? new Date().toISOString().slice(0, 10)
  const currentStart = addDays(latestDate, -29)
  const previousEnd = addDays(currentStart, -1)
  const previousStart = addDays(previousEnd, -29)

  const inRange = (date: string, start: string, end: string) =>
    date >= start && date <= end

  const currentRows = datedRows.filter((item) =>
    inRange(item.date, currentStart, latestDate)
  )
  const previousRows = datedRows.filter((item) =>
    inRange(item.date, previousStart, previousEnd)
  )

  const currentRevenue = currentRows.reduce(
    (sum, item) => sum + (revenueKey ? numberValue(item.row[revenueKey]) : 0),
    0
  )
  const previousRevenue = previousRows.reduce(
    (sum, item) => sum + (revenueKey ? numberValue(item.row[revenueKey]) : 0),
    0
  )

  const currentCogs = currentRows.reduce(
    (sum, item) => sum + (cogsKey ? numberValue(item.row[cogsKey]) : 0),
    0
  )
  const currentOpex = currentRows.reduce((sum, item) => {
    if (opexKey) return sum + numberValue(item.row[opexKey])
    if (expenseKey) return sum + numberValue(item.row[expenseKey])
    return sum
  }, 0)

  const currentGrossProfit = currentRevenue - currentCogs
  const currentGrossMargin = currentRevenue
    ? (currentGrossProfit / currentRevenue) * 100
    : null
  const currentNetProfit = currentGrossProfit - currentOpex

  const daily = new Map<string, { revenue: number; cogs: number; expenses: number }>()

  datedRows
    .filter((item) => inRange(item.date, currentStart, latestDate))
    .forEach((item) => {
      const existing = daily.get(item.date) ?? {
        revenue: 0,
        cogs: 0,
        expenses: 0,
      }

      existing.revenue += revenueKey ? numberValue(item.row[revenueKey]) : 0
      existing.cogs += cogsKey ? numberValue(item.row[cogsKey]) : 0
      existing.expenses += opexKey
        ? numberValue(item.row[opexKey])
        : expenseKey
          ? numberValue(item.row[expenseKey])
          : 0

      daily.set(item.date, existing)
    })

  const trend = Array.from({ length: 30 }, (_, index) => {
    const date = addDays(currentStart, index)
    const values = daily.get(date) ?? {
      revenue: 0,
      cogs: 0,
      expenses: 0,
    }

    return {
      label: labelForDate(date),
      revenue: values.revenue,
      profit: values.revenue - values.cogs - values.expenses,
    }
  })

  const expenseTotals = new Map<string, number>()

  validRows.forEach(({ row }) => {
    const expense = opexKey
      ? numberValue(row[opexKey])
      : expenseKey
        ? numberValue(row[expenseKey])
        : 0

    if (!expense) return

    const category = categoryKey
      ? textValue(row[categoryKey]) || "Operating expenses"
      : "Operating expenses"

    expenseTotals.set(category, (expenseTotals.get(category) ?? 0) + expense)
  })

  const expenseBreakdown = [...expenseTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }))

  const revenueChange = percentageChange(currentRevenue, previousRevenue)
  const hasFinanceFields = Boolean(cogsKey || opexKey || expenseKey)
  const hasRevenue = revenue > 0

  const insight = !hasRevenue
    ? {
        title: "Connect financial data to unlock Finance.",
        description:
          "Nexora needs revenue, sales, or amount fields to calculate financial performance.",
        evidence: "No compatible financial fields detected",
      }
    : !hasFinanceFields
      ? {
          title: "Revenue is connected, but cost data is missing.",
          description:
            "Nexora can show revenue performance now. Connect COGS or expense fields to calculate profit and margin.",
          evidence: `${validRows.length.toLocaleString("en-IN")} usable financial rows`,
        }
      : currentGrossMargin !== null && currentGrossMargin < 25
        ? {
            title: "Gross margin is worth watching.",
            description:
              "The latest 30-day gross margin is below 25%. Review product costs and pricing before the pressure compounds.",
            evidence: `${currentGrossMargin.toFixed(1)}% gross margin`,
          }
        : revenueChange !== null && revenueChange > 10
          ? {
              title: "Revenue is accelerating.",
              description:
                "Revenue in the latest 30-day window is meaningfully higher than the preceding 30 days.",
              evidence: `${revenueChange > 0 ? "+" : ""}${revenueChange.toFixed(1)}% vs previous period`,
            }
          : {
              title: "Financial performance is stable.",
              description:
                "No major negative signal was detected in the connected financial fields for the latest period.",
              evidence:
                currentGrossMargin !== null
                  ? `${currentGrossMargin.toFixed(1)}% current gross margin`
                  : "Financial fields connected",
            }

  return (
    <main className="min-h-full bg-[#F1F0F8]">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: "Finance" }]} />
        <FinanceOverview
          data={{
            businessName: business.name,
            currencyCode: business.currency_code || "INR",
            hasRevenue,
            hasFinanceFields,
            revenue,
            cogs,
            operatingExpenses,
            grossProfit,
            grossMargin,
            netProfit,
            netMargin,
            currentRevenue,
            previousRevenue,
            revenueChange,
            currentGrossProfit,
            currentGrossMargin,
            currentNetProfit,
            trend,
            expenseBreakdown,
            connectedDatasets: readyDatasets.length,
            financeRows: financeRows.length,
            orderRows: orderRows.length,
            insight,
          }}
        />
      </div>
    </main>
  )
}
