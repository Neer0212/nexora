"use server"

import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const customerSchema = z.object({
  id: z.string().optional().nullable(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")).nullable(),
  phone: z.string().optional().or(z.literal("")).nullable(),
  type: z.enum(["Individual", "Business", "Wholesale"]).default("Individual"),
  location: z.string().optional().or(z.literal("")).nullable(),
})

export type CustomerFormValues = z.infer<typeof customerSchema>

export async function saveCustomer(businessId: string, values: CustomerFormValues) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Unauthorized" }

  const parsed = customerSchema.safeParse(values)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const payload = {
    business_id: businessId,
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    type: parsed.data.type,
    location: parsed.data.location || null,
  }

  if (parsed.data.id) {
    const { error } = await supabase.from('customers').update(payload).eq('id', parsed.data.id).eq('business_id', businessId)
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await supabase.from('customers').insert(payload)
    if (error) return { success: false, error: error.message }
  }

  revalidatePath('/pos/customers')
  return { success: true }
}

export async function getCustomerHistory(businessId: string, customerId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, order_date, total_amount, status, payment_method')
    .eq('business_id', businessId)
    .eq('customer_id', customerId)
    .order('order_date', { ascending: false })
    .limit(50)

  if (error) return []
  return data
}
