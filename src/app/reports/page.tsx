import { redirect } from "next/navigation"
import ReportsOverview from "@/components/reports/ReportsOverview"
import { getBusinessSnapshot } from "@/lib/business-snapshot"
import { createClient } from "@/lib/supabase/server"

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const snapshot = await getBusinessSnapshot()
  return <ReportsOverview snapshot={snapshot} />
}
