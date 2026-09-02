import { getWorkspaceContext } from "@/lib/workspace-data"
import { createClient } from "@/lib/supabase/server"
import SuppliersClient from "./SuppliersClient"

export default async function SuppliersPage() {
  const ctx = await getWorkspaceContext()
  const supabase = await createClient()
  
  const { data: suppliers, error: suppliersError } = await supabase
    .from('suppliers')
    .select('*')
    .eq('business_id', ctx.businessId)
    .order('name')

  if (suppliersError) {
    console.error("Error fetching suppliers:", suppliersError)
  }
  
  const { data: supplierExpenses, error: expError } = await supabase
    .from('expenses')
    .select('supplier_id, amount')
    .eq('business_id', ctx.businessId)
    .not('supplier_id', 'is', null)
    
  if (expError) {
    console.error("Error fetching supplier expenses:", expError)
  }
  
  const purchaseAggregates = (supplierExpenses || []).reduce((acc: any, exp) => {
    if (exp.supplier_id) {
      if (!acc[exp.supplier_id]) acc[exp.supplier_id] = 0;
      acc[exp.supplier_id] += Number(exp.amount)
    }
    return acc
  }, {})

  return (
    <SuppliersClient 
      businessId={ctx.businessId} 
      suppliers={suppliers || []} 
      purchaseAggregates={purchaseAggregates}
    />
  )
}
