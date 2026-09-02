"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const supplierSchema = z.object({
  id: z.string().optional().nullable(),
  name: z.string().min(1, "Name is required"),
  code: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().or(z.literal("")).nullable(),
  phone: z.string().optional().nullable(),
  contact_name: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  status: z.enum(["Active", "Inactive"]).optional().default("Active"),
})

export async function saveSupplier(businessId: string, values: z.infer<typeof supplierSchema>) {
  const supabase = await createClient()
  
  const parsed = supplierSchema.parse(values)
  
  const payload = {
    business_id: businessId,
    name: parsed.name,
    code: parsed.code || null,
    email: parsed.email || null,
    phone: parsed.phone || null,
    contact_name: parsed.contact_name || null,
    location: parsed.location || null,
    status: parsed.status,
  }

  if (parsed.id) {
    const { error } = await supabase
      .from("suppliers")
      .update(payload)
      .eq("id", parsed.id)
      .eq("business_id", businessId)
      
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from("suppliers")
      .insert([payload])
      
    if (error) throw new Error(error.message)
  }

  revalidatePath("/pos/suppliers")
}

export async function getSupplierActivity(businessId: string, supplierId: string) {
  const supabase = await createClient()
  
  const { data: inventoryTransactions, error: invError } = await supabase
    .from("inventory_transactions")
    .select("*, variant:product_variants(id, product:products(name), sku, price)")
    .eq("business_id", businessId)
    .eq("supplier_id", supplierId)
    .order("created_at", { ascending: false })
    .limit(10)
    
  if (invError) {
    console.error("Error fetching supplier inventory transactions:", invError)
  }
  
  const { data: purchases, error: purError } = await supabase
    .from("expenses")
    .select("*")
    .eq("business_id", businessId)
    .eq("supplier_id", supplierId)
    .order("expense_date", { ascending: false })
    .limit(10)

  if (purError) {
    console.error("Error fetching supplier purchases:", purError)
  }

  return {
    transactions: inventoryTransactions || [],
    purchases: purchases || []
  }
}
