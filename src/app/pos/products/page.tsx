import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceContext } from "@/lib/workspace-data"
import ProductsClient from "./ProductsClient"

export const metadata: Metadata = {
  title: "POS Products",
  description: "Manage product catalogue for the point of sale.",
  robots: { index: false, follow: false },
}

export default async function POSProductsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const context = await getWorkspaceContext().catch(() => null)
  if (!context) redirect("/onboarding")

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", context.businessId)
    .order("name")

  if (error) {
    throw new Error(`Failed to load products: ${error.message}`)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <ProductsClient businessId={context.businessId} initialProducts={products || []} />
    </div>
  )
}
