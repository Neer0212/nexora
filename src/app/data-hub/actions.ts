"use server"

import { createClient } from "@/lib/supabase/server"

/**
 * Delete a dataset and all its associated rows.
 *
 * Server-side enforcement:
 * - Requires authenticated user
 * - Requires business membership
 * - Requires owner or admin role for destructive actions
 * - Cascading deletion: dataset_rows are removed by FK CASCADE
 */
export async function deleteDataset(datasetId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "AUTH_REQUIRED" }
  }

  // Verify business membership and role
  const { data: membership, error: membershipError } = await supabase
    .from("business_users")
    .select("business_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  if (membershipError || !membership) {
    return { success: false, error: "BUSINESS_REQUIRED" }
  }

  // Only owner and admin can delete datasets
  if (membership.role !== "owner" && membership.role !== "admin") {
    return { success: false, error: "DATA_ACCESS_DENIED" }
  }

  // Verify dataset belongs to the user's business
  const { data: dataset, error: datasetError } = await supabase
    .from("datasets")
    .select("id, business_id")
    .eq("id", datasetId)
    .eq("business_id", membership.business_id)
    .single()

  if (datasetError || !dataset) {
    return { success: false, error: "DATASET_NOT_FOUND" }
  }

  // Delete dataset rows first (belt-and-suspenders — FK CASCADE handles this too)
  await supabase
    .from("dataset_rows")
    .delete()
    .eq("dataset_id", datasetId)
    .eq("business_id", membership.business_id)

  // Delete data imports for this dataset
  await supabase
    .from("data_imports")
    .delete()
    .eq("dataset_id", datasetId)
    .eq("business_id", membership.business_id)

  // Delete the dataset itself
  const { error: deleteError } = await supabase
    .from("datasets")
    .delete()
    .eq("id", datasetId)
    .eq("business_id", membership.business_id)

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  return { success: true }
}
