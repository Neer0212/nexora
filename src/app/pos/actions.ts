"use server"

import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { getWorkspaceContext } from "@/lib/workspace-data"

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
  const context = await getWorkspaceContext().catch(() => null)
  if (!context || context.businessId !== businessId) return { success: false, error: "Unauthorized workspace" }

  const supabase = await createClient()

  const parsed = checkoutSchema.safeParse(payload)
  if (!parsed.success) return { success: false, error: "Invalid checkout data" }

  const data = parsed.data

  // Fetch product data to validate prices and availability server-side
  const productIds = data.items.filter(i => i.product_id).map(i => i.product_id!)
  let productMap = new Map()
  
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('id, name, selling_price, unit_cost, tax_rate, stock_quantity')
      .eq('business_id', businessId)
      .in('id', productIds)
    
    if (products) {
      productMap = new Map(products.map(p => [p.id, p]))
    }
  }

  let calcSubtotal = 0
  let calcTax = 0

  const validatedItems = []
  
  for (const item of data.items) {
    const price = item.price
    let cost = item.cost
    let taxRate = 0

    if (item.product_id && productMap.has(item.product_id)) {
      const dbProduct = productMap.get(item.product_id)
      
      // Validate stock availability server-side
      if (dbProduct.stock_quantity !== null && dbProduct.stock_quantity < item.quantity) {
         return { success: false, error: `Insufficient stock for ${item.name}. Available: ${dbProduct.stock_quantity}` }
      }
      
      // Use DB cost and tax rate to prevent client tampering
      cost = dbProduct.unit_cost ?? 0
      taxRate = dbProduct.tax_rate ?? 0
    }

    const lineTotal = price * item.quantity
    const lineTax = lineTotal * (taxRate / 100)
    
    calcSubtotal += lineTotal
    calcTax += lineTax

    validatedItems.push({
      ...item,
      cost,
      tax: lineTax,
      total: lineTotal + lineTax
    })
  }

  // Recalculate totals server-side
  const calcDiscount = Math.min(data.discount, calcSubtotal) // Discount cannot exceed subtotal
  const calcTotal = calcSubtotal + calcTax - calcDiscount

  // Retry up to 3 times in case of order number collision
  for (let attempt = 0; attempt < 3; attempt++) {
    const dateStr = new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 8)
    const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase()
    const orderNumber = `ORD-${dateStr}-${randomStr}`

    const { data: orderId, error } = await supabase.rpc("process_pos_checkout", {
      p_business_id: businessId,
      p_customer_id: data.customer_id || null,
      p_order_number: orderNumber,
      p_subtotal: calcSubtotal,
      p_discount: calcDiscount,
      p_tax: calcTax,
      p_total: calcTotal,
      p_payment_method: data.payment_method,
      p_items: validatedItems,
    })

    if (error) {
      // If unique violation on order_number, retry
      if (error.message.includes("unique") || error.message.includes("duplicate")) {
        continue
      }
      return { success: false, error: error.message }
    }

    revalidatePath("/pos/orders")
    return { success: true, orderId: orderId as string, orderNumber }
  }

  return { success: false, error: "Failed to generate unique order number. Please try again." }
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

export async function quickCreateCustomer(businessId: string, name: string, phone: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('customers')
    .insert({ business_id: businessId, name, phone })
    .select('id, name, phone')
    .single()
  if (error) return { success: false, error: error.message }
  
  revalidatePath('/pos/customers')
  
  return { success: true, customer: data }
}
