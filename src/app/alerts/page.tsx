import { redirect } from "next/navigation"
import AlertsOverview from "@/components/alerts/AlertsOverview"
import { getBusinessSnapshot } from "@/lib/business-snapshot"
import { createClient } from "@/lib/supabase/server"

export default async function AlertsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const snapshot = await getBusinessSnapshot()
  const alerts = snapshot.signals.map((signal) => ({
    id: signal.id,
    priority: signal.priority,
    title: signal.title,
    why: signal.why,
    evidence: signal.evidence,
  }))

  return (
    <AlertsOverview
      alerts={alerts}
      latestDate={snapshot.latestDate}
    />
  )
}
