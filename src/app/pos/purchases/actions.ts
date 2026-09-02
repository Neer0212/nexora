"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const createPurchaseSchema = z.object({
  supplier_id: z.string().uuid(),
  notes: z.string().optional(),
  expected_date: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().positive(),
    unit_cost: z.number().min(0)
  })).min(1)
})

export async function createPurchase(businessId: string, payload: any) {
  const supabase = await createClient()
  
  const result = createPurchaseSchema.safeParse(payload)
  if (!result.success) {
    return { error: "Invalid data provided" }
  }

  const { supplier_id, notes, expected_date, items } = result.data

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase()
  const purchaseNumber = `PO-${dateStr}-${randomStr}`
  
  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0)

  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .insert({
      business_id: businessId,
      supplier_id,
      purchase_number: purchaseNumber,
      status: 'draft',
      payment_status: 'unpaid',
      total_amount: totalAmount,
      notes,
      expected_date: expected_date || null,
      order_date: new Date().toISOString()
    })
    .select()
    .single()

  if (purchaseError) {
    return { error: purchaseError.message }
  }

  const purchaseItems = items.map(item => ({
    purchase_id: purchase.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_cost: item.unit_cost,
    total_price: item.quantity * item.unit_cost
  }))

  const { error: itemsError } = await supabase
    .from("purchase_items")
    .insert(purchaseItems)

  if (itemsError) {
    return { error: itemsError.message }
  }

  revalidatePath('/pos/purchases')
  return { success: true }
}

export async function receivePurchase(businessId: string, purchaseId: string, items: { product_id: string, quantity_received: number, unit_cost: number }[]) {
  const supabase = await createClient()

  const { error } = await supabase.rpc('process_stock_in', {
    p_business_id: businessId,
    p_purchase_id: purchaseId,
    p_items: items
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/pos/purchases')
  revalidatePath('/pos/inventory')
  return { success: true }
}

export async function cancelPurchase(businessId: string, purchaseId: string) {
  const supabase = await createClient()

  const { data: purchase, error: fetchError } = await supabase
    .from('purchases')
    .select('status')
    .eq('id', purchaseId)
    .eq('business_id', businessId)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  if (purchase.status !== 'draft' && purchase.status !== 'ordered') {
    return { error: "Only draft or ordered purchases can be cancelled" }
  }

  const { error: updateError } = await supabase
    .from('purchases')
    .update({ status: 'cancelled' })
    .eq('id', purchaseId)
    .eq('business_id', businessId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/pos/purchases')
  return { success: true }
}
