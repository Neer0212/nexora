import type { Metadata } from "next"
import { redirect } from "next/navigation"
import CustomerOverview from "@/components/intelligence/CustomerOverview"
import { getEntityInsights } from "@/lib/entity-insights"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Customer Intelligence", description: "Understand customer concentration, repeat activity, and revenue contribution.", robots: { index: false, follow: false } }
export default async function CustomersPage() { const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect("/login"); const data=await getEntityInsights(); return <CustomerOverview businessName={data.businessName} currencyCode={data.currencyCode} customers={data.customers}/> }
