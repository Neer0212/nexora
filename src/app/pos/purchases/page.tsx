import { getWorkspaceContext } from "@/lib/workspace-data"
import { createClient } from "@/lib/supabase/server"
import PurchasesClient from "./PurchasesClient"

export default async function PurchasesPage() {
  const ctx = await getWorkspaceContext()
  const supabase = await createClient()

  const { data: purchases } = await supabase
    .from('purchases')
    .select('*, supplier:suppliers(id, name)')
    .eq('business_id', ctx.businessId)
    .order('order_date', { ascending: false })
    .limit(100)

  const { data: products } = await supabase
    .from('products')
    .select('id, name, sku, barcode, unit_cost, stock_quantity')
    .eq('business_id', ctx.businessId)
    .eq('active', true)
    .order('name')

  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name')
    .eq('business_id', ctx.businessId)
    .order('name')

  return (
    <PurchasesClient 
      businessId={ctx.businessId} 
      purchases={purchases as any || []} 
      products={products || []} 
      suppliers={suppliers || []} 
    />
  )
}
