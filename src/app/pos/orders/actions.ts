"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function processReturn(businessId: string, originalOrderId: string, reason?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  const { data: returnOrderId, error } = await supabase.rpc("process_pos_return", {
    p_business_id: businessId,
    p_original_order_id: originalOrderId,
    p_reason: reason || "Customer return",
  })

  if (error) return { success: false, error: error.message }

  revalidatePath("/pos/orders")
  revalidatePath("/pos/inventory")
  return { success: true, returnOrderId }
}
