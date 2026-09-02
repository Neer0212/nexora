import { getWorkspaceContext } from "@/lib/workspace-data"
import { createClient } from "@/lib/supabase/server"
import ExpensesClient from "./ExpensesClient"

export default async function ExpensesPage() {
  const ctx = await getWorkspaceContext()
  const supabase = await createClient()
  
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('*, supplier:suppliers(id, name)')
    .eq('business_id', ctx.businessId)
    .order('expense_date', { ascending: false })
    .limit(200)

  if (expensesError) {
    console.error("Error fetching expenses:", expensesError)
  }
  
  const { data: suppliers, error: suppliersError } = await supabase
    .from('suppliers')
    .select('id, name')
    .eq('business_id', ctx.businessId)
    .order('name')

  if (suppliersError) {
    console.error("Error fetching suppliers:", suppliersError)
  }

  return (
    <ExpensesClient 
      businessId={ctx.businessId} 
      expenses={(expenses as any) || []} 
      suppliers={suppliers || []} 
    />
  )
}
