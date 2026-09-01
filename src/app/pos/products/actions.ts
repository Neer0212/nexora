"use server"

import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Product name is required"),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  unit_cost: z.number().min(0).optional().nullable(),
  selling_price: z.number().min(0, "Selling price is required"),
  tax_rate: z.number().min(0).max(100).optional().nullable(),
  stock_quantity: z.number().default(0),
  low_stock_threshold: z.number().default(0),
  active: z.boolean().default(true),
})

export type ProductFormValues = z.infer<typeof productSchema>

export async function saveProduct(businessId: string, values: ProductFormValues) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  const parsed = productSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: "Invalid product data" }

  const data = parsed.data

  // Ensure barcode uniqueness if provided
  if (data.barcode) {
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("business_id", businessId)
      .eq("barcode", data.barcode)
      .maybeSingle()

    if (existing && existing.id !== data.id) {
      return { success: false, error: "This barcode is already assigned to another product in your workspace." }
    }
  }

  const payload = {
    business_id: businessId,
    name: data.name,
    sku: data.sku || null,
    barcode: data.barcode || null,
    category: data.category || null,
    brand: data.brand || null,
    unit: data.unit || null,
    unit_cost: data.unit_cost ?? null,
    selling_price: data.selling_price,
    tax_rate: data.tax_rate ?? 0,
    stock_quantity: data.stock_quantity,
    low_stock_threshold: data.low_stock_threshold,
    active: data.active,
  }

  if (data.id) {
    const { error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", data.id)
      .eq("business_id", businessId)
    
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await supabase
      .from("products")
      .insert(payload)
    
    if (error) return { success: false, error: error.message }
  }

  revalidatePath("/pos/products")
  return { success: true }
}

export async function toggleProductActive(businessId: string, productId: string, active: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  const { error } = await supabase
    .from("products")
    .update({ active })
    .eq("id", productId)
    .eq("business_id", businessId)

  revalidatePath("/pos/products")
  return { success: !error, error: error?.message }
}
