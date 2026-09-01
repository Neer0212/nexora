import type { Metadata } from "next"
import { redirect } from "next/navigation"
import AppShell from "@/components/layout/AppShell"
import InvestigateOverview from "@/components/investigate/InvestigateOverview"
import { getInvestigateData } from "@/lib/investigate"
export const metadata:Metadata={title:"What Changed",description:"Investigate recent changes across connected business records.",robots:{index:false,follow:false}}
export default async function Page(){let d;try{d=await getInvestigateData()}catch(e){if(e instanceof Error&&e.message==="AUTH_REQUIRED")redirect("/login");if(e instanceof Error&&e.message==="BUSINESS_REQUIRED")redirect("/onboarding");throw e}return <AppShell><InvestigateOverview kind="changes" rows={d.rows} columns={d.columns} currencyCode={d.currencyCode}/></AppShell>}
