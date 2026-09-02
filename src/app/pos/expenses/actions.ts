"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const EXPENSE_CATEGORIES = [
  'Rent', 'Utilities', 'Salary', 'Marketing', 'Transport', 
  'Supplies', 'Packaging', 'Maintenance', 'Insurance', 'Other'
] as const

const expenseSchema = z.object({
  id: z.string().optional().nullable(),
  category: z.enum(EXPENSE_CATEGORIES),
  description: z.string().optional().nullable(),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  expense_date: z.string().min(1),
  supplier_id: z.string().optional().nullable(),
  payment_method: z.string().optional().nullable(),
  payment_status: z.string().optional().nullable(),
  tax_amount: z.coerce.number().optional().default(0),
  reference_number: z.string().optional().nullable(),
})

export async function saveExpense(businessId: string, values: z.infer<typeof expenseSchema>) {
  const supabase = await createClient()
  
  const parsed = expenseSchema.parse(values)
  
  const payload = {
    business_id: businessId,
    category: parsed.category,
    description: parsed.description,
    amount: parsed.amount,
    expense_date: parsed.expense_date,
    supplier_id: parsed.supplier_id || null,
    payment_method: parsed.payment_method || null,
    payment_status: parsed.payment_status || 'Pending',
    tax_amount: parsed.tax_amount || 0,
    reference_number: parsed.reference_number || null,
  }

  if (parsed.id) {
    const { error } = await supabase
      .from("expenses")
      .update(payload)
      .eq("id", parsed.id)
      .eq("business_id", businessId)
      
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from("expenses")
      .insert([payload])
      
    if (error) throw new Error(error.message)
  }

  revalidatePath("/pos/expenses")
}

export async function deleteExpense(businessId: string, expenseId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("business_id", businessId)

  if (error) throw new Error(error.message)
  revalidatePath("/pos/expenses")
}
