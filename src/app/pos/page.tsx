import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceContext } from "@/lib/workspace-data"
import POSClient from "./POSClient"

export const metadata: Metadata = {
  title: "Nexora POS",
  description: "Point of sale checkout.",
  robots: { index: false, follow: false },
}

export default async function POSPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const context = await getWorkspaceContext().catch(() => null)
  if (!context) redirect("/onboarding")

  // Prefetch initial products for the POS
  const { data: initialProducts } = await supabase
    .from("products")
    .select("id, name, sku, barcode, selling_price, unit_cost, tax_rate, stock_quantity, low_stock_threshold")
    .eq("business_id", context.businessId)
    .eq("active", true)
    .order("name")
    .limit(30)

  // Prefetch customers
  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, email, phone")
    .eq("business_id", context.businessId)
    .order("name")
    .limit(50)

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 h-[calc(100vh-64px)] flex flex-col">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#433D8B]">Operations</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#17153B]">Checkout</h1>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <POSClient 
          businessId={context.businessId} 
          initialProducts={initialProducts || []} 
          customers={customers || []} 
        />
      </div>
    </div>
  )
}
