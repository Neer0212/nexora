/**
 * Nexora — Dataset classification and per-dataset schema detection.
 *
 * CRITICAL: Schema detection happens per-dataset / per-row structure.
 * Never detect schema from rows[0] globally and apply it to unrelated datasets.
 */

import { norm, keyOf } from "./data-utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DatasetKind =
  | "sales"
  | "products"
  | "inventory"
  | "suppliers"
  | "customers"
  | "finance"
  | "projects"
  | "other"

export type DatasetInfo = {
  id: string
  name: string
  fileName: string | null
  rowCount: number | null
  status: string
  createdAt: string
}

export type ClassifiedRow = {
  datasetId: string
  datasetKind: DatasetKind
  row: Record<string, unknown>
}

export type DatasetSchema = {
  kind: DatasetKind
  columns: string[]
  rowCount: number
}

// ---------------------------------------------------------------------------
// Dataset Classification
// ---------------------------------------------------------------------------

/**
 * Keyword maps used to infer dataset kind from name/filename.
 * Checked in order — first match wins.
 * Extended with industry-specific aliases for all supported Nexora industries.
 */
const KIND_KEYWORDS: Array<{ kind: DatasetKind; terms: string[] }> = [
  {
    kind: "sales",
    terms: [
      "order", "sales", "revenue", "transaction", "invoice",
      // Restaurant / Hospitality
      "billing", "folio", "ticket", "reservation", "booking",
      // Gym / Education
      "membership", "enrollment", "fee", "payment", "subscription",
      // Salon / Clinic
      "appointment", "consultation", "session",
      // Automotive
      "service_job", "work_order", "job_card",
    ],
  },
  {
    kind: "inventory",
    terms: [
      "inventory", "stock", "warehouse", "storage",
      // Restaurant
      "kitchen", "ingredient", "recipe",
      // Automotive
      "parts", "spares",
      // Salon / Clinic
      "supplies", "supply", "medical_supply",
      // Education
      "materials", "stationery",
      // Hospitality
      "amenities", "housekeeping",
    ],
  },
  {
    kind: "suppliers",
    terms: [
      "supplier", "vendor", "procurement", "purchase",
      // Restaurant
      "food_vendor", "food_supplier",
      // Automotive
      "parts_supplier",
    ],
  },
  {
    kind: "customers",
    terms: [
      "customer", "client", "account", "buyer",
      // Gym
      "member", "subscriber",
      // Clinic
      "patient",
      // Education
      "student", "learner", "candidate",
      // Hospitality / Restaurant
      "guest", "visitor", "traveller",
    ],
  },
  {
    kind: "products",
    terms: [
      "product", "catalog", "item", "sku", "merchandise",
      // Restaurant
      "menu", "menu_item", "dish",
      // Salon / Clinic
      "service", "treatment", "procedure",
      // Gym
      "plan", "membership_plan", "class",
      // Education
      "course", "batch", "subject",
      // Hospitality
      "room", "room_type", "package",
      // Automotive
      "part", "repair_type",
    ],
  },
  {
    kind: "finance",
    terms: [
      "finance", "expense", "profit", "cost", "budget", "p&l", "pnl",
      // Restaurant
      "food_cost",
      // Automotive
      "labour_cost", "parts_cost",
      // Gym / Education
      "tuition", "fee_collection",
    ],
  },
  {
    kind: "projects",
    terms: ["project", "milestone", "phase", "deliverable", "work_order"],
  },
]

/**
 * Column-level hints — if a dataset has these columns, it's likely this kind.
 * Extended with industry-specific column names.
 */
const KIND_COLUMN_HINTS: Array<{ kind: DatasetKind; columns: string[] }> = [
  {
    kind: "sales",
    columns: [
      "order_id", "orderid", "order_number", "invoice_number", "total_amount",
      // Industry aliases
      "appointment_date", "booking_date", "membership_date", "enrollment_date",
      "check_in", "table_number", "reservation_id", "job_id", "service_order_id",
    ],
  },
  {
    kind: "inventory",
    columns: [
      "stock_qty", "quantity_in_stock", "reorder_level", "warehouse", "on_hand",
      // Industry aliases
      "ingredient_qty", "parts_available", "supply_qty", "amenity_stock",
    ],
  },
  {
    kind: "suppliers",
    columns: [
      "supplier_id", "lead_time", "lead_time_days", "vendor_name", "reliability",
      // Industry aliases
      "food_supplier", "parts_supplier", "medical_supplier",
    ],
  },
  {
    kind: "customers",
    columns: [
      "customer_id", "customer_name", "client_name", "account_id",
      // Industry aliases
      "member_name", "member_id", "patient_name", "patient_id",
      "student_name", "student_id", "guest_name", "guest_id",
    ],
  },
  {
    kind: "products",
    columns: [
      "sku", "unit_cost", "selling_price", "product_category", "unit_price",
      // Industry aliases
      "menu_item", "service_name", "membership_plan", "course_name",
      "room_type", "room_number", "part_name", "treatment",
    ],
  },
  {
    kind: "finance",
    columns: [
      "cogs", "cost_of_goods", "operating_expenses", "gross_profit", "net_income",
      // Industry aliases
      "food_cost", "labour_charge", "tuition_fee", "membership_fee",
      "consultation_fee", "parts_cost",
    ],
  },
  {
    kind: "projects",
    columns: ["project_id", "project_name", "deadline", "milestone", "start_date", "expected_end_date"],
  },
]


/**
 * Build a label from a dataset's name + filename for classification.
 */
export function datasetLabel(dataset: DatasetInfo): string {
  return `${dataset.name} ${dataset.fileName ?? ""}`.toLowerCase()
}

/**
 * Classify a dataset based on its name, filename, and column structure.
 *
 * Strategy:
 * 1. Check dataset name/filename against keyword maps (high confidence)
 * 2. Check column names against column-level hints (medium confidence)
 * 3. Default to "other"
 */
export function classifyDataset(
  dataset: DatasetInfo,
  sampleRow?: Record<string, unknown>
): DatasetKind {
  const label = datasetLabel(dataset)

  // Step 1: Check name/filename keywords
  for (const { kind, terms } of KIND_KEYWORDS) {
    if (terms.some((term) => label.includes(term))) {
      return kind
    }
  }

  // Step 2: Check column-level hints from a sample row
  if (sampleRow) {
    const columnKeys = Object.keys(sampleRow).map(norm)

    for (const { kind, columns } of KIND_COLUMN_HINTS) {
      const matchCount = columns.filter((col) =>
        columnKeys.includes(norm(col))
      ).length
      if (matchCount >= 2) return kind
    }
  }

  return "other"
}

// ---------------------------------------------------------------------------
// Per-Dataset Row Grouping
// ---------------------------------------------------------------------------

type RawStoredRow = {
  dataset_id: string
  row_number: number
  row_data: unknown
}

/**
 * Group raw stored rows by dataset and classify them.
 *
 * This is the CRITICAL function that ensures each dataset's schema
 * is detected independently. The schema of "Orders" must never
 * contaminate the schema of "Inventory".
 */
export function classifyRows(
  datasets: DatasetInfo[],
  storedRows: RawStoredRow[]
): ClassifiedRow[] {
  const datasetMap = new Map(datasets.map((d) => [d.id, d]))

  // Group rows by dataset to get sample rows for classification
  const rowsByDataset = new Map<string, Record<string, unknown>[]>()
  for (const stored of storedRows) {
    const row = (stored.row_data ?? {}) as Record<string, unknown>
    const existing = rowsByDataset.get(stored.dataset_id) ?? []
    existing.push(row)
    rowsByDataset.set(stored.dataset_id, existing)
  }

  // Classify each dataset using its own sample row
  const datasetKinds = new Map<string, DatasetKind>()
  for (const [datasetId, rows] of rowsByDataset) {
    const dataset = datasetMap.get(datasetId)
    if (dataset) {
      datasetKinds.set(datasetId, classifyDataset(dataset, rows[0]))
    }
  }

  // Build classified rows
  return storedRows.map((stored) => ({
    datasetId: stored.dataset_id,
    datasetKind: datasetKinds.get(stored.dataset_id) ?? "other",
    row: (stored.row_data ?? {}) as Record<string, unknown>,
  }))
}

/**
 * Filter classified rows to a specific domain.
 *
 * For sales data, also includes "other" datasets that happen to have
 * order-like columns (order_id + revenue/amount).
 */
export function rowsForDomain(
  rows: ClassifiedRow[],
  domain: DatasetKind
): Record<string, unknown>[] {
  return rows
    .filter((r) => {
      if (r.datasetKind === domain) return true
      // For sales, also include "other" datasets with order-like columns
      if (domain === "sales" && r.datasetKind === "other") {
        const hasOrderId = keyOf(r.row, ["order_id", "orderid", "order", "order_number"]) !== null
        const hasRevenue = keyOf(r.row, ["revenue", "sales", "amount", "total"]) !== null
        return hasOrderId && hasRevenue
      }
      return false
    })
    .map((r) => r.row)
}

/**
 * Get the column names from a domain's rows.
 * Uses the first row of that domain as the sample.
 */
export function columnsForDomain(
  rows: ClassifiedRow[],
  domain: DatasetKind
): string[] {
  const domainRows = rows.filter((r) => r.datasetKind === domain)
  const first = domainRows[0]?.row
  return first ? Object.keys(first) : []
}

/**
 * Get a summary of which dataset kinds are present.
 */
export function connectedDomains(rows: ClassifiedRow[]): Set<DatasetKind> {
  return new Set(rows.map((r) => r.datasetKind).filter((k) => k !== "other"))
}

/**
 * Get names of datasets that contributed to a domain.
 */
export function datasetNamesForDomain(
  datasets: DatasetInfo[],
  rows: ClassifiedRow[],
  domain: DatasetKind
): string[] {
  const ids = new Set(
    rows.filter((r) => r.datasetKind === domain).map((r) => r.datasetId)
  )
  return datasets.filter((d) => ids.has(d.id)).map((d) => d.name)
}

// ---------------------------------------------------------------------------
// Schema Detection per Row
// ---------------------------------------------------------------------------

/**
 * Detect the schema/structure of a specific row.
 * Returns the detected key for each common business field.
 *
 * This should be called per-dataset, using a sample row from that dataset.
 */
export function detectRowSchema(row: Record<string, unknown>) {
  return {
    revenue: keyOf(row, ["revenue", "sales", "amount", "total", "total_amount", "net_sales", "gross_revenue"]),
    orderId: keyOf(row, ["order_id", "orderid", "order", "order_number", "invoice_id"]),
    date: keyOf(row, ["order_date", "transaction_date", "date", "created_at", "invoice_date"]),
    quantity: keyOf(row, ["quantity", "qty", "units", "unit_quantity", "items"]),
    product: keyOf(row, ["product_id", "product", "product_name", "sku", "item"]),
    customer: keyOf(row, ["customer_id", "customer", "customer_name", "client", "account"]),
    status: keyOf(row, ["order_status", "status", "state"]),
    channel: keyOf(row, ["sales_channel", "channel", "source", "platform"]),
    // Inventory-specific
    stockQty: keyOf(row, ["stock_qty", "stock", "quantity_in_stock", "inventory", "quantity", "available_qty", "on_hand", "current_stock"]),
    reorderLevel: keyOf(row, ["reorder_level", "reorder_point", "minimum_stock", "min_stock"]),
    unitCost: keyOf(row, ["unit_cost", "cost", "cost_price", "purchase_price", "cost_per_unit"]),
    warehouse: keyOf(row, ["warehouse", "location", "store", "branch"]),
    // Supplier-specific
    supplierName: keyOf(row, ["supplier", "supplier_name", "vendor", "vendor_name", "supplier_id"]),
    leadTime: keyOf(row, ["lead_time", "lead_time_days", "delivery_days", "days_to_deliver", "average_lead_time"]),
    reliability: keyOf(row, ["reliability", "reliability_score", "on_time_rate", "reliability_pct"]),
    // Project-specific
    projectName: keyOf(row, ["project", "project_name", "project_id", "work_order"]),
    owner: keyOf(row, ["owner", "project_owner", "manager", "assigned_to", "lead"]),
    deadline: keyOf(row, ["deadline", "due_date", "expected_end_date", "end_date", "target_date"]),
    startDate: keyOf(row, ["start_date", "begin_date", "commenced"]),
    progress: keyOf(row, ["progress", "completion", "percent_complete", "pct_complete"]),
    priority: keyOf(row, ["priority", "urgency", "importance"]),
    // Entity-specific
    entityName: keyOf(row, ["name", "entity_name", "company_name"]),
    entityType: keyOf(row, ["type", "entity_type", "category"]),
    email: keyOf(row, ["email", "contact_email", "email_address"]),
    phone: keyOf(row, ["phone", "contact_phone", "mobile", "telephone"]),
    location: keyOf(row, ["location", "city", "address", "region"]),
    // Category for products
    category: keyOf(row, ["category", "product_category", "group", "department"]),
    sellingPrice: keyOf(row, ["selling_price", "price", "retail_price", "sale_price", "mrp"]),
  }
}

export type RowSchema = ReturnType<typeof detectRowSchema>
