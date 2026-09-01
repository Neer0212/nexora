import type { Metadata } from "next"
import { redirect } from "next/navigation"
import AppShell from "@/components/layout/AppShell"
import GoalsOverview from "@/components/intelligence/GoalsOverview"
import { getBusinessSnapshot } from "@/lib/business-snapshot"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Goals & Targets", description: "Track Nexora business performance against targets.", robots: { index: false, follow: false } }
export default async function GoalsPage() { const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect("/login"); const snapshot=await getBusinessSnapshot(); return <AppShell><GoalsOverview revenue={snapshot.revenue} orders={snapshot.orders} customers={snapshot.customers} lowStock={snapshot.lowStock} currencyCode={snapshot.currencyCode} latestDate={snapshot.latestDate}/></AppShell> }
