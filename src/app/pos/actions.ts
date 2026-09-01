"use server"

import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const cartItemSchema = z.object({
  product_id: z.string().optional().nullable(),
  name: z.string(),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  quantity: z.number().min(1),
  price: z.number().min(0),
  cost: z.number().min(0),
  discount: z.number().min(0),
  tax: z.number().min(0),
  total: z.number().min(0),
})

const checkoutSchema = z.object({
  customer_id: z.string().optional().nullable(),
  subtotal: z.number().min(0),
  discount: z.number().min(0),
  tax: z.number().min(0),
  total: z.number().min(0),
  payment_method: z.string().min(1),
  items: z.array(cartItemSchema).min(1),
})

export type CheckoutPayload = z.infer<typeof checkoutSchema>

export async function processCheckout(businessId: string, payload: CheckoutPayload) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  const parsed = checkoutSchema.safeParse(payload)
  if (!parsed.success) return { success: false, error: "Invalid checkout data" }

  const data = parsed.data

  // Generate an order number (e.g., ORD-20260901-XXXX)
  const dateStr = new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 8)
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase()
  const orderNumber = `ORD-${dateStr}-${randomStr}`

  // Call the atomic checkout RPC
  const { data: orderId, error } = await supabase.rpc("process_pos_checkout", {
    p_business_id: businessId,
    p_customer_id: data.customer_id || null,
    p_order_number: orderNumber,
    p_subtotal: data.subtotal,
    p_discount: data.discount,
    p_tax: data.tax,
    p_total: data.total,
    p_payment_method: data.payment_method,
    p_items: data.items,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, orderId: orderId as string, orderNumber }
}

export async function getPOSProducts(businessId: string, query: string) {
  const supabase = await createClient()
  
  // Basic search matching name, sku, or barcode
  let q = supabase
    .from("products")
    .select("id, name, sku, barcode, selling_price, unit_cost, tax_rate, stock_quantity, low_stock_threshold")
    .eq("business_id", businessId)
    .eq("active", true)
  
  if (query) {
    q = q.or(`name.ilike.%${query}%,sku.ilike.%${query}%,barcode.eq.${query}`)
  }
  
  const { data, error } = await q.limit(20)
  
  if (error) return []
  return data
}
