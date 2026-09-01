"use server"

import { createClient } from "@/lib/supabase/server"

export async function saveGoal(goalKey: string, target: number) {
  if (!Number.isFinite(target) || target < 0) throw new Error("INVALID_TARGET")

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("AUTH_REQUIRED")

  const { data: membership, error: membershipError } = await supabase
    .from("business_users")
    .select("business_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  if (membershipError) throw new Error(membershipError.message)
  if (!membership) throw new Error("BUSINESS_REQUIRED")

  const { error } = await supabase
    .from("goals")
    .upsert(
      { business_id: membership.business_id, goal_key: goalKey, target },
      { onConflict: "business_id,goal_key" }
    )

  if (error) throw new Error(error.message)
}
