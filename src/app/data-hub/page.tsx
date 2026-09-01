import { redirect } from "next/navigation"

import DataHub from "@/components/data-hub/DataHubFixed"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Data Hub | Nexora",
  description:
    "Connect CSV and Excel business data to Nexora, review what was detected, and import it into your workspace.",
}

export default async function DataHubPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: membership, error: membershipError } = await supabase
    .from("business_users")
    .select("business_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  if (membershipError) {
    throw new Error(membershipError.message)
  }

  if (!membership) {
    redirect("/onboarding")
  }

  const [{ data: business, error: businessError }, { data: datasets, error: datasetsError }] =
    await Promise.all([
      supabase
        .from("businesses")
        .select("id, name, currency_code")
        .eq("id", membership.business_id)
        .single(),
      supabase
        .from("datasets")
        .select("id, name, file_name, row_count, column_count, status, created_at")
        .eq("business_id", membership.business_id)
        .order("created_at", { ascending: false })
        .limit(8),
    ])

  if (businessError || !business) {
    throw new Error(businessError?.message || "Business could not be loaded.")
  }

  if (datasetsError) {
    throw new Error(datasetsError.message)
  }

  return (
    <DataHub
      business={{
        id: business.id,
        name: business.name,
        currencyCode: business.currency_code,
      }}
      datasets={datasets ?? []}
    />
  )
}
