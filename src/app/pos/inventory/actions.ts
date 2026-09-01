"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const adjustmentSchema = z.object({
  product_id: z.string(),
  supplier_id: z.string().optional().nullable(),
  transaction_type: z.enum(["purchase", "adjustment", "return", "transfer"]),
  quantity: z.number().min(0.01, "Quantity must be positive"),
  is_negative: z.boolean(),
  unit_cost: z.number().min(0).optional(),
  reference: z.string().optional(),
})

export type AdjustmentPayload = z.infer<typeof adjustmentSchema>

export async function submitInventoryTransaction(businessId: string, payload: AdjustmentPayload) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  const parsed = adjustmentSchema.safeParse(payload)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || "Invalid data" }
  
  const data = parsed.data
  const actualQty = data.is_negative ? -Math.abs(data.quantity) : Math.abs(data.quantity)

  // Use the atomic_stock_adjustment RPC — avoids SELECT+UPDATE race condition
  const { data: newStock, error } = await supabase.rpc("atomic_stock_adjustment", {
    p_business_id: businessId,
    p_product_id: data.product_id,
    p_delta: actualQty,
    p_type: data.transaction_type,
    p_unit_cost: data.unit_cost || null,
    p_supplier_id: data.supplier_id || null,
    p_reference: data.reference || null,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath("/pos/inventory")
  revalidatePath("/pos/products")
  return { success: true, newStock }
}
