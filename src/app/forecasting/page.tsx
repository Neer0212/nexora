import type { Metadata } from "next"
import { redirect } from "next/navigation"
import AppShell from "@/components/layout/AppShell"
import ForecastOverview from "@/components/intelligence/ForecastOverview"
import { getBusinessSnapshot } from "@/lib/business-snapshot"
import { getEntityInsights } from "@/lib/entity-insights"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Forecasting", description: "Project the next business period from connected revenue history.", robots: { index: false, follow: false } }
export default async function ForecastingPage() { const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect("/login"); const [snapshot,entities]=await Promise.all([getBusinessSnapshot(),getEntityInsights()]); return <AppShell><ForecastOverview revenue={snapshot.revenue} previousRevenue={snapshot.previousRevenue} revenueChange={snapshot.revenueChange} currencyCode={snapshot.currencyCode} latestDate={snapshot.latestDate} dailyRevenue={entities.dailyRevenue}/></AppShell> }
