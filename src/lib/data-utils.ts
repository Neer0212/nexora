/**
 * Nexora — Shared data parsing and normalization utilities.
 *
 * Every analytical page should use these helpers rather than
 * re-implementing parsing logic independently.
 */

// ---------------------------------------------------------------------------
// Text & Number Parsing
// ---------------------------------------------------------------------------

/** Safely extract a trimmed string from any value. */
export function text(value: unknown): string {
  if (value === null || value === undefined) return ""
  return String(value).trim()
}

/**
 * Parse a numeric value, stripping common currency symbols,
 * commas, percentage signs, and whitespace.
 *
 * Returns 0 for non-finite or unparseable values.
 */
export function num(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  const cleaned = text(value).replace(/[₹$€£,%\s]/g, "")
  if (cleaned === "") return 0
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

// ---------------------------------------------------------------------------
// Key Normalization & Alias Lookup
// ---------------------------------------------------------------------------

/**
 * Normalize a column/key name by lowercasing and stripping
 * spaces, underscores, and hyphens.
 *
 * Example: "Order Date" → "orderdate", "order_date" → "orderdate"
 */
export function norm(value: string): string {
  return value.toLowerCase().replace(/[\s_-]+/g, "")
}

/**
 * Find the actual key in a row object that matches one of the
 * provided aliases (checked in priority order).
 *
 * Uses normalized comparison so "Order Date", "order_date",
 * and "orderdate" all match the alias "order_date".
 *
 * IMPORTANT: This operates per-row — do NOT cache the result
 * and apply it to rows from a different dataset.
 */
export function keyOf(row: Record<string, unknown>, aliases: string[]): string | null {
  const keys = Object.keys(row)
  const normalized = new Map(keys.map((key) => [norm(key), key]))
  for (const alias of aliases) {
    const match = normalized.get(norm(alias))
    if (match) return match
  }
  return null
}

// ---------------------------------------------------------------------------
// Date Parsing & Arithmetic
// ---------------------------------------------------------------------------

/**
 * Parse a value into a `YYYY-MM-DD` date string.
 *
 * Supports:
 *  - ISO date strings ("2024-03-15T12:00:00")
 *  - Short date strings ("2024-3-5")
 *  - Date objects
 *  - General Date() parseable strings
 *
 * Returns null for empty or unparseable values.
 */
export function parseDate(value: unknown): string | null {
  const raw = text(value)
  if (!raw) return null

  // Fast path: YYYY-MM-DD (with optional time portion)
  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`
  }

  // Fallback: try Date constructor
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

/**
 * Add (or subtract) days from a `YYYY-MM-DD` date string.
 * Returns a new `YYYY-MM-DD` string.
 */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/**
 * Format a `YYYY-MM-DD` date string for display labels.
 * Example: "2024-03-15" → "15 Mar"
 */
export function formatLabel(date: string): string {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(
    new Date(`${date}T00:00:00`)
  )
}

// ---------------------------------------------------------------------------
// Business Logic Helpers
// ---------------------------------------------------------------------------

/** Statuses that indicate a cancelled/returned/refunded order. */
const EXCLUDED_STATUSES = new Set(["cancelled", "canceled", "returned", "refunded"])

/** Check if an order status indicates it should be excluded from active metrics. */
export function isCancelled(status: string): boolean {
  return EXCLUDED_STATUSES.has(status.toLowerCase().trim())
}

// ---------------------------------------------------------------------------
// Currency Formatting
// ---------------------------------------------------------------------------

/**
 * Format a number as a compact currency string.
 * Examples: 1245000 with "INR" → "₹12.45L" or "₹12,45,000"
 */
export function formatCurrency(value: number, currencyCode: string = "INR"): string {
  const locale = currencyCode === "INR" ? "en-IN" : "en-US"
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currencyCode} ${value.toLocaleString()}`
  }
}

/**
 * Format a number as a compact display string.
 * Examples: 1245000 → "12.5L" (INR), "1.2M" (USD)
 */
export function formatCompact(value: number, currencyCode: string = "INR"): string {
  if (currencyCode === "INR") {
    if (Math.abs(value) >= 1_00_00_000) return `${(value / 1_00_00_000).toFixed(1)}Cr`
    if (Math.abs(value) >= 1_00_000) return `${(value / 1_00_000).toFixed(1)}L`
    if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`
    return value.toFixed(0)
  }
  if (Math.abs(value) >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toFixed(0)
}

/**
 * Format a percentage change for display.
 * Example: -12.4 → "↓ 12.4%", 5.2 → "↑ 5.2%"
 */
export function formatChange(change: number | null): string {
  if (change === null) return "—"
  const arrow = change > 0 ? "↑" : change < 0 ? "↓" : "→"
  return `${arrow} ${Math.abs(change).toFixed(1)}%`
}

// ---------------------------------------------------------------------------
// Column Alias Registries
// ---------------------------------------------------------------------------

/** Common aliases for revenue/amount columns. */
export const REVENUE_ALIASES = [
  "revenue", "sales", "amount", "total", "total_amount",
  "net_sales", "gross_revenue", "sale_amount", "total_revenue",
  "invoice_amount", "order_value", "value",
]

/** Common aliases for order ID columns. */
export const ORDER_ID_ALIASES = [
  "order_id", "orderid", "order", "order_number",
  "order_no", "invoice_id", "transaction_id",
]

/** Common aliases for date columns. */
export const DATE_ALIASES = [
  "order_date", "transaction_date", "date", "created_at",
  "invoice_date", "sale_date", "purchase_date",
]

/** Common aliases for quantity columns. */
export const QUANTITY_ALIASES = [
  "quantity", "qty", "units", "unit_quantity",
  "items", "count", "pieces",
]

/** Common aliases for product columns. */
export const PRODUCT_ALIASES = [
  "product_id", "product", "product_name", "sku",
  "item", "item_name", "item_id",
]

/** Common aliases for customer columns. */
export const CUSTOMER_ALIASES = [
  "customer_id", "customer", "customer_name", "client",
  "client_name", "account", "account_id", "buyer",
]

/** Common aliases for status columns. */
export const STATUS_ALIASES = [
  "order_status", "status", "state", "order_state",
]

/** Common aliases for stock/inventory quantity columns. */
export const STOCK_QTY_ALIASES = [
  "stock_qty", "stock", "quantity_in_stock", "inventory",
  "quantity", "available_qty", "on_hand", "current_stock",
  "stock_level", "in_stock",
]

/** Common aliases for reorder level columns. */
export const REORDER_ALIASES = [
  "reorder_level", "reorder_point", "minimum_stock",
  "min_stock", "safety_stock", "min_quantity",
]

/** Common aliases for unit cost columns. */
export const UNIT_COST_ALIASES = [
  "unit_cost", "cost", "cost_price", "purchase_price",
  "cost_per_unit", "buying_price", "price",
]

/** Common aliases for supplier name columns. */
export const SUPPLIER_NAME_ALIASES = [
  "supplier", "supplier_name", "vendor", "vendor_name",
  "supplier_id",
]

/** Common aliases for lead time columns. */
export const LEAD_TIME_ALIASES = [
  "lead_time", "lead_time_days", "delivery_days",
  "days_to_deliver", "average_lead_time",
]

/** Common aliases for reliability columns. */
export const RELIABILITY_ALIASES = [
  "reliability", "reliability_score", "on_time_rate",
  "reliability_pct", "on_time_delivery",
]

/** Common aliases for sales channel columns. */
export const CHANNEL_ALIASES = [
  "sales_channel", "channel", "source", "platform",
]
