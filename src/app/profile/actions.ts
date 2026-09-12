"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateBusinessIndustry(
  businessId: string,
  industryId: string,
  businessType: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Ensure user belongs to business and is owner/admin
  const { data: membership } = await supabase
    .from("business_users")
    .select("role")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .single()

  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    throw new Error("Permission denied")
  }

  const { error } = await supabase
    .from("businesses")
    .update({ industry: industryId, business_type: businessType })
    .eq("id", businessId)

  if (error) throw new Error(error.message)

  revalidatePath("/", "layout")
  return { success: true }
}
