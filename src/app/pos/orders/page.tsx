import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceContext } from "@/lib/workspace-data"
import OrdersClient from "./OrdersClient"

export const metadata: Metadata = {
  title: "POS Orders",
  description: "View point of sale order history and receipts.",
  robots: { index: false, follow: false },
}

export default async function POSOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const context = await getWorkspaceContext().catch(() => null)
  if (!context) redirect("/onboarding")

  // Fetch recent orders with items and payments
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id, order_number, status, order_date, created_at, subtotal, discount, tax_amount, total_amount, payment_method, payment_status,
      customer:customers(id, name, phone, email),
      items:order_items(
        id, product_name_snapshot, sku_snapshot, quantity, unit_price, discount, tax, total_amount
      )
    `)
    .eq("business_id", context.businessId)
    .order("created_at", { ascending: false })
    .limit(50)

  // Fetch business profile to print on receipts
  const { data: business } = await supabase
    .from("businesses")
    .select("name")
    .eq("id", context.businessId)
    .single()

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <OrdersClient 
        orders={(orders as any) || []}
        businessName={business?.name || "Nexora Business"}
      />
    </div>
  )
}
