import { getWorkspaceContext } from "@/lib/workspace-data"
import { createClient } from "@/lib/supabase/server"
import CustomersClient from "./CustomersClient"

export default async function CustomersPage() {
  const ctx = await getWorkspaceContext()
  const supabase = await createClient()

  // Fetch customers
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', ctx.businessId)
    .order('name')

  // Fetch order counts/totals per customer
  const { data: orderData } = await supabase
    .from('orders')
    .select('customer_id, total_amount, order_date')
    .eq('business_id', ctx.businessId)

  return <CustomersClient businessId={ctx.businessId} customers={customers || []} orderData={orderData || []} />
}
