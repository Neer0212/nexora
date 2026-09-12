/**
 * Nexora — Unified authenticated workspace data fetcher.
 *
 * Eliminates the repeated auth → membership → business → datasets → rows
 * pattern from every server-side page.
 */

import { createClient } from "@/lib/supabase/server"
import { type IndustryId, type IndustryConfig, getIndustryConfig } from "@/lib/industries"
import {
  type DatasetInfo,
  type ClassifiedRow,
  classifyRows,
} from "./dataset-utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WorkspaceContext = {
  userId: string
  userEmail: string
  businessId: string
  businessName: string
  currencyCode: string
  role: string
  industry: IndustryId
  businessType: string | null
  industryConfig: IndustryConfig
}

export type WorkspaceData = {
  context: WorkspaceContext
  datasets: DatasetInfo[]
  rows: ClassifiedRow[]
}

type RawStoredRow = {
  dataset_id: string
  row_number: number
  row_data: unknown
}

// ---------------------------------------------------------------------------
// Context Resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the authenticated workspace context.
 *
 * Throws structured errors:
 * - `AUTH_REQUIRED` — no authenticated user
 * - `BUSINESS_REQUIRED` — user has no business membership
 * - Other errors from Supabase propagate as-is
 */
export async function getWorkspaceContext(): Promise<WorkspaceContext> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("AUTH_REQUIRED")
  }

  const { data: membership, error: membershipError } = await supabase
    .from("business_users")
    .select("business_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  if (membershipError) throw new Error(membershipError.message)
  if (!membership) throw new Error("BUSINESS_REQUIRED")

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, currency_code, industry, business_type")
    .eq("id", membership.business_id)
    .single()

  if (businessError || !business) {
    throw new Error(businessError?.message || "Business could not be loaded.")
  }

  const industryConfig = getIndustryConfig(business.industry)

  return {
    userId: user.id,
    userEmail: user.email ?? "",
    businessId: business.id,
    businessName: business.name,
    currencyCode: business.currency_code || "INR",
    role: membership.role,
    industry: industryConfig.id,
    businessType: business.business_type ?? null,
    industryConfig,
  }
}

// ---------------------------------------------------------------------------
// Dataset Fetching
// ---------------------------------------------------------------------------

/**
 * Fetch all ready datasets for a business.
 */
export async function getWorkspaceDatasets(
  businessId: string
): Promise<DatasetInfo[]> {
  const supabase = await createClient()

  const { data: datasets, error } = await supabase
    .from("datasets")
    .select("id, name, file_name, row_count, status, created_at")
    .eq("business_id", businessId)
    .eq("status", "ready")
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)

  return (datasets ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    fileName: d.file_name,
    rowCount: d.row_count,
    status: d.status,
    createdAt: d.created_at,
  }))
}

/**
 * Fetch all dataset rows for a business, classified by domain.
 *
 * This is the main data loading function that combines:
 * 1. Fetch all ready datasets
 * 2. Fetch all rows for those datasets
 * 3. Classify each row by its dataset's domain
 */
export async function getWorkspaceData(): Promise<WorkspaceData> {
  const context = await getWorkspaceContext()
  const datasets = await getWorkspaceDatasets(context.businessId)
  const datasetIds = datasets.map((d) => d.id)

  if (datasetIds.length === 0) {
    return { context, datasets, rows: [] }
  }

  const supabase = await createClient()

  const { data: stored, error } = await supabase
    .from("dataset_rows")
    .select("dataset_id, row_number, row_data")
    .eq("business_id", context.businessId)
    .in("dataset_id", datasetIds)
    .order("row_number", { ascending: true })

  if (error) throw new Error(error.message)

  const rawStoredRows = (stored ?? []) as RawStoredRow[]
  
  // Transform format to match what appendOperationalData expects
  let unifiedRows: { datasetId: string; rowNumber: number; row: Record<string, unknown> }[] = rawStoredRows.map((r, i) => ({
    datasetId: r.dataset_id,
    rowNumber: i,
    row: (r.row_data ?? {}) as Record<string, unknown>
  }))

  const { appendOperationalData } = await import("@/lib/pos-integration")
  unifiedRows = await appendOperationalData(context.businessId, unifiedRows)

  // Map back to RawStoredRow shape for classification
  const rowsToClassify = unifiedRows.map((r, i) => ({
    dataset_id: r.datasetId,
    row_number: i,
    row_data: r.row
  }))

  const allDatasets = [
    ...datasets,
    { id: "pos-sales", name: "POS Sales Data", fileName: "pos-system", rowCount: 1, status: "ready", createdAt: new Date().toISOString() },
    { id: "pos-expenses", name: "POS Expenses Data", fileName: "pos-system", rowCount: 1, status: "ready", createdAt: new Date().toISOString() },
    { id: "pos-inventory", name: "POS Inventory Data", fileName: "pos-system", rowCount: 1, status: "ready", createdAt: new Date().toISOString() }
  ]

  const rows = classifyRows(allDatasets, rowsToClassify)

  return { context, datasets: allDatasets, rows }
}

/**
 * Fetch all datasets for a business (all statuses, for Data Hub).
 */
export async function getAllDatasets(businessId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("datasets")
    .select("id, name, file_name, row_count, column_count, status, created_at, source_type, schema_definition, created_by")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)
  return data ?? []
}
