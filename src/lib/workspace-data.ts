/**
 * Nexora — Unified authenticated workspace data fetcher.
 *
 * Eliminates the repeated auth → membership → business → datasets → rows
 * pattern from every server-side page.
 */

import { createClient } from "@/lib/supabase/server"
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
    .select("id, name, currency_code")
    .eq("id", membership.business_id)
    .single()

  if (businessError || !business) {
    throw new Error(businessError?.message || "Business could not be loaded.")
  }

  return {
    userId: user.id,
    userEmail: user.email ?? "",
    businessId: business.id,
    businessName: business.name,
    currencyCode: business.currency_code || "INR",
    role: membership.role,
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

  const rows = classifyRows(datasets, (stored ?? []) as RawStoredRow[])

  return { context, datasets, rows }
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
