import { redirect } from "next/navigation"
import type { Metadata } from "next"
import CrossModuleIntelligence from "@/components/intelligence/CrossModuleIntelligence"
import { createClient } from "@/lib/supabase/server"

// ==========================================
// Types
// ==========================================
type Row = Record<string, unknown>

type Dataset = {
    id: string
    name: string
    file_name: string | null
    row_count: number | null
    status: string
    created_at: string
}

type Stored = {
    dataset_id: string
    row_number: number
    row_data: unknown
}

// ==========================================
// Helper Functions
// ==========================================
const text = (v: unknown) => (v == null ? "" : String(v).trim())

const num = (v: unknown) => {
    if (typeof v === "number") return Number.isFinite(v) ? v : 0
    if (typeof v === "string") {
        const n = Number(v.replace(/[₹$€£,%\s]/g, ""))
        return Number.isFinite(n) ? n : 0
    }
    return 0
}

const norm = (v: string) => v.toLowerCase().replace(/[\s_-]+/g, "")

function key(row: Row, aliases: string[]) {
    const map = new Map(Object.keys(row).map((k) => [norm(k), k]))
    for (const a of aliases) {
        const k = map.get(norm(a))
        if (k) return k
    }
    return null
}

function date(v: unknown) {
    const s = text(v)
    if (!s) return null
    const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
    if (m) {
        return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`
    }
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

function addDays(v: string, n: number) {
    const d = new Date(`${v}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() + n)
    return d.toISOString().slice(0, 10)
}

function label(d: Dataset) {
    return `${d.name} ${d.file_name ?? ""}`.toLowerCase()
}

function group(
    datasets: Dataset[],
    rows: Array<{ datasetId: string; row: Row }>,
    terms: string[]
) {
    const ids = new Set(
        datasets
            .filter((d) => terms.some((t) => label(d).includes(t)))
            .map((d) => d.id)
    )
    return rows.filter((r) => ids.has(r.datasetId))
}

// ==========================================
// Metadata
// ==========================================
export const metadata: Metadata = {
    title: "Cross-Module Intelligence",
    description:
        "Correlate connected business signals across sales, inventory, suppliers, and customers.",
    alternates: { canonical: "/intelligence" },
    robots: { index: false, follow: false },
}

// ==========================================
// Main Page Component
// ==========================================
export default async function IntelligencePage() {
    const supabase = await createClient()

    // 1. Authentication & Route Guard
    const {
        data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect("/login")

    const { data: membership, error: membershipError } = await supabase
        .from("business_users")
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle()

    if (membershipError) throw new Error(membershipError.message)
    if (!membership) redirect("/onboarding")

    // 2. Fetch Business & Ready Datasets
    const [
        { data: business, error: businessError },
        { data: datasets, error: datasetsError },
    ] = await Promise.all([
        supabase
            .from("businesses")
            .select("name,currency_code")
            .eq("id", membership.business_id)
            .single(),
        supabase
            .from("datasets")
            .select("id,name,file_name,row_count,status,created_at")
            .eq("business_id", membership.business_id)
            .eq("status", "ready")
            .order("created_at", { ascending: false })
            .limit(50),
    ])

    if (businessError || !business) {
        throw new Error(businessError?.message || "Business could not be loaded.")
    }
    if (datasetsError) throw new Error(datasetsError.message)

    const ready = (datasets ?? []) as Dataset[]
    const ids = ready.map((d) => d.id)

    // 3. Fetch Stored Dataset Rows
    const { data: stored, error: rowsError } = ids.length
        ? await supabase
            .from("dataset_rows")
            .select("dataset_id,row_number,row_data")
            .eq("business_id", membership.business_id)
            .in("dataset_id", ids)
            .order("row_number", { ascending: true })
        : { data: [], error: null }

    if (rowsError) throw new Error(rowsError.message)

    // 4. Map & Categorize Data Modules
    const rows = ((stored ?? []) as Stored[]).map((r) => ({
        datasetId: r.dataset_id,
        row: (r.row_data ?? {}) as Row,
    }))

    const orders = group(ready, rows, ["order", "sales", "revenue"])
    const inventory = group(ready, rows, ["inventory", "stock", "warehouse"])
    const suppliers = group(ready, rows, ["supplier", "vendor"])
    const customers = group(ready, rows, ["customer", "account"])
    const products = group(ready, rows, ["product", "catalog", "sku"])

    // 5. Dynamic Key Detection
    const dateKey = orders[0]
        ? key(orders[0].row, ["order_date", "transaction_date", "date", "created_at"])
        : null
    const revenueKey = orders[0]
        ? key(orders[0].row, ["revenue", "sales", "amount", "total", "total_amount"])
        : null
    const statusKey = orders[0]
        ? key(orders[0].row, ["order_status", "status"])
        : null
    const productKey = orders[0]
        ? key(orders[0].row, ["product_id", "product", "sku", "item"])
        : null

    // 6. Calculate 30-Day Orders & Revenue
    const dated = orders
        .map((r) => ({ ...r, date: date(dateKey ? r.row[dateKey] : null) }))
        .filter((r): r is typeof r & { date: string } => Boolean(r.date))

    const latest =
        dated.map((r) => r.date).sort().at(-1) ??
        new Date().toISOString().slice(0, 10)
    const start = addDays(latest, -29)

    const cancelled = new Set(["cancelled", "canceled", "returned", "refunded"])
    const active = dated.filter(
        (r) =>
            r.date >= start &&
            r.date <= latest &&
            !cancelled.has(text(statusKey ? r.row[statusKey] : "").toLowerCase())
    )

    const revenue = active.reduce(
        (s, r) => s + (revenueKey ? num(r.row[revenueKey]) : 0),
        0
    )

    // 7. Calculate Low Stock Items
    const qtyKey = inventory[0]
        ? key(inventory[0].row, ["quantity", "stock_qty", "stock", "available_qty", "on_hand"])
        : null
    const reorderKey = inventory[0]
        ? key(inventory[0].row, ["reorder_level", "reorder_point", "minimum_stock", "min_stock"])
        : null

    const lowStock = inventory.filter(
        (r) =>
            Boolean(qtyKey && reorderKey) &&
            num(r.row[qtyKey!]) <= num(r.row[reorderKey!])
    ).length

    // 8. Track Product Identifiers & Top Performer
    const productNameKey = products[0]
        ? key(products[0].row, ["name", "product_name", "product", "sku"])
        : null
    const productIdKey = products[0]
        ? key(products[0].row, ["id", "product_id", "sku", "product"])
        : null

    const names = new Map<string, string>()
    for (const r of products) {
        const id = productIdKey ? text(r.row[productIdKey]) : ""
        if (id) {
            names.set(id, productNameKey ? text(r.row[productNameKey]) || id : id)
        }
    }

    const sales = new Map<string, number>()
    for (const r of active) {
        const id = productKey ? text(r.row[productKey]) : ""
        if (id) {
            sales.set(id, (sales.get(id) ?? 0) + (revenueKey ? num(r.row[revenueKey]) : 0))
        }
    }

    const topId = [...sales.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    const topProduct = topId ? names.get(topId) ?? topId : null

    // 9. Generate Contextual Signals
    const signals: Array<{
        severity: "watch" | "positive" | "info"
        title: string
        detail: string
        evidence: string
    }> = []

    if (lowStock && sales.size) {
        signals.push({
            severity: "watch",
            title: "Demand and stock are colliding.",
            detail: `${lowStock} inventory record${lowStock === 1 ? " is" : "s are"} at or below its reorder threshold while recent orders are generating demand.`,
            evidence: `${lowStock} low-stock record${lowStock === 1 ? "" : "s"} + ${sales.size} demand-linked product${sales.size === 1 ? "" : "s"}`,
        })
    }

    if (suppliers.length && lowStock) {
        signals.push({
            severity: "watch",
            title: "Supplier context needs attention.",
            detail: "Inventory pressure can now be evaluated alongside connected supplier records.",
            evidence: `${lowStock} low-stock record${lowStock === 1 ? "" : "s"} + ${suppliers.length} supplier row${suppliers.length === 1 ? "" : "s"}`,
        })
    }

    if (topProduct) {
        signals.push({
            severity: "positive",
            title: "Demand has a clear leader.",
            detail: `${topProduct} is the strongest revenue signal in the latest 30-day order window.`,
            evidence: `${sales.size} products with recent sales`,
        })
    }

    if (customers.length) {
        signals.push({
            severity: "info",
            title: "Customer context is available.",
            detail: "Orders can now be interpreted alongside customer records instead of as isolated transactions.",
            evidence: `${customers.length} customer row${customers.length === 1 ? "" : "s"} connected`,
        })
    }

    const connected = [orders, products, inventory, suppliers, customers].filter(
        (g) => g.length > 0
    ).length

    // 10. Render Component Widget View
    return (
        <CrossModuleIntelligence
            businessName={business.name}
            latestDate={latest}
            connectedCount={connected}
            totalCore={5}
            signals={signals.slice(0, 6)}
            revenue={revenue}
            lowStock={lowStock}
            suppliers={suppliers.length}
            customers={customers.length}
            topProduct={topProduct} 
            currencyCode={business.currency_code || "INR"} />)
}