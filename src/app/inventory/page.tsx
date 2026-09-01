import type { Metadata } from "next"
import { redirect } from "next/navigation"
import AppShell from "@/components/layout/AppShell"
import InvestigateOverview from "@/components/investigate/InvestigateOverview"
import { getInvestigateData } from "@/lib/investigate"
export const metadata:Metadata={title:"Inventory",description:"Investigate inventory records and stock activity from connected business data.",robots:{index:false,follow:false}}
export default async function Page(){try{const d=await getInvestigateData();return <AppShell><InvestigateOverview kind="inventory" rows={d.rows} columns={d.columns} currencyCode={d.currencyCode}/></AppShell>}catch(e){if(e instanceof Error&&e.message==="AUTH_REQUIRED")redirect("/login");if(e instanceof Error&&e.message==="BUSINESS_REQUIRED")redirect("/onboarding");throw e}}
