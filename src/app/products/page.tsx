import type { Metadata } from "next"
import { redirect } from "next/navigation"
import ProductOverview from "@/components/intelligence/ProductOverview"
import { getEntityInsights } from "@/lib/entity-insights"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Product Intelligence", description: "Understand product revenue, demand, and concentration across connected orders.", robots: { index: false, follow: false } }
export default async function ProductsPage() { const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect("/login"); const data=await getEntityInsights(); return <ProductOverview currencyCode={data.currencyCode} products={data.products}/> }
