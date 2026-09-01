import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceContext } from "@/lib/workspace-data"
import InventoryClient from "./InventoryClient"

export const metadata: Metadata = {
  title: "POS Inventory",
  description: "Track and adjust product inventory.",
  robots: { index: false, follow: false },
}

export default async function POSInventoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const context = await getWorkspaceContext().catch(() => null)
  if (!context) redirect("/onboarding")

  // Fetch recent ledger transactions
  const { data: ledger } = await supabase
    .from("inventory_transactions")
    .select(`
      id, transaction_type, quantity, unit_cost, reference, transaction_date, created_at,
      product:products(id, name, sku),
      supplier:suppliers(id, name)
    `)
    .eq("business_id", context.businessId)
    .order("created_at", { ascending: false })
    .limit(100)

  // Fetch products for dropdown
  const { data: products } = await supabase
    .from("products")
    .select("id, name, stock_quantity, low_stock_threshold, unit_cost")
    .eq("business_id", context.businessId)
    .eq("active", true)
    .order("name")

  // Fetch suppliers for dropdown
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, name")
    .eq("business_id", context.businessId)
    .order("name")

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <InventoryClient 
        businessId={context.businessId} 
        transactions={(ledger as any) || []}
        products={products || []}
        suppliers={suppliers || []}
      />
    </div>
  )
}
