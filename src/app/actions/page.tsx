import { redirect } from "next/navigation"
import ActionsOverview from "@/components/actions/ActionsOverview"
import { getBusinessSnapshot } from "@/lib/business-snapshot"
import { createClient } from "@/lib/supabase/server"

export default async function ActionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  let snapshot
  try {
    snapshot = await getBusinessSnapshot()
  } catch (error) {
    if (error instanceof Error && error.message === "BUSINESS_REQUIRED") redirect("/onboarding")
    throw error
  }

  return (
    <ActionsOverview
      signals={snapshot.signals}
      businessName={snapshot.businessName}
    />
  )
}
