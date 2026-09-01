import type { Metadata } from "next"
import { redirect } from "next/navigation"
import AppShell from "@/components/layout/AppShell"
import GoalsOverview from "@/components/intelligence/GoalsOverview"
import { getBusinessSnapshot } from "@/lib/business-snapshot"
import { createClient } from "@/lib/supabase/server"
import { saveGoal } from "./actions"

export const metadata: Metadata = { title: "Goals & Targets", description: "Track Nexora business performance against targets.", robots: { index: false, follow: false } }

export default async function GoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: membership, error: membershipError } = await supabase
    .from("business_users")
    .select("business_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()
  if (membershipError) throw new Error(membershipError.message)
  if (!membership) redirect("/onboarding")

  const [snapshot, { data: goals, error: goalsError }] = await Promise.all([
    getBusinessSnapshot(),
    supabase.from("goals").select("goal_key,target").eq("business_id", membership.business_id),
  ])
  if (goalsError) throw new Error(goalsError.message)

  const savedTargets = Object.fromEntries((goals ?? []).map((goal) => [goal.goal_key, Number(goal.target)]))

  return (
    <AppShell>
      <GoalsOverview
        revenue={snapshot.revenue}
        orders={snapshot.orders}
        customers={snapshot.customers}
        lowStock={snapshot.lowStock}
        currencyCode={snapshot.currencyCode}
        latestDate={snapshot.latestDate}
        savedTargets={savedTargets}
        onSaveGoal={saveGoal}
      />
    </AppShell>
  )
}
