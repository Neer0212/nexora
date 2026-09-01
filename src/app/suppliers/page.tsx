import type { Metadata } from "next"
import { redirect } from "next/navigation"
import AppShell from "@/components/layout/AppShell"
import InvestigateOverview from "@/components/investigate/InvestigateOverview"
import { getInvestigateData } from "@/lib/investigate"
export const metadata:Metadata={title:"Suppliers",description:"Investigate supplier-linked records and operational performance.",robots:{index:false,follow:false}}
export default async function Page(){let d;try{d=await getInvestigateData()}catch(e){if(e instanceof Error&&e.message==="AUTH_REQUIRED")redirect("/login");if(e instanceof Error&&e.message==="BUSINESS_REQUIRED")redirect("/onboarding");throw e}return <AppShell><InvestigateOverview kind="suppliers" rows={d.rows} columns={d.columns} currencyCode={d.currencyCode}/></AppShell>}
