"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getWorkspaceContext } from "@/lib/workspace-data"

export async function processReturn(
  businessId: string,
  originalOrderId: string,
  reason?: string,
  idempotencyKey?: string
) {
  const context = await getWorkspaceContext().catch(() => null)
  if (!context || context.businessId !== businessId) return { success: false, error: "Unauthorized workspace" }

  const supabase = await createClient()

  const { data: returnOrderId, error } = await supabase.rpc("process_pos_return", {
    p_business_id: businessId,
    p_original_order_id: originalOrderId,
    p_reason: reason || "Customer return",
    p_idempotency_key: idempotencyKey || null,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath("/pos/orders")
  revalidatePath("/pos/inventory")
  return { success: true, returnOrderId }
}
