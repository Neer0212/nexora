import { redirect } from "next/navigation"

import AppShell from "@/components/layout/AppShell"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, industry, business_type, currency_code")
    .eq("id", membership.business_id)
    .single()

  if (businessError || !business) {
    throw new Error(
      businessError?.message || "Business could not be loaded."
    )
  }

  return (
    <AppShell
      business={{
        id: business.id,
        name: business.name,
        industry: business.industry,
        businessType: business.business_type,
        currencyCode: business.currency_code,
      }}
      user={{
        email: user.email ?? "",
        role: membership.role,
      }}
    >
      {children}
    </AppShell>
  )
}