import { createClient } from "@/lib/supabase/server"
import { getIndustryConfig } from "@/lib/industries"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

async function resolveIndustry(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: membership } = await supabase
      .from("business_users")
      .select("business_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()

    if (!membership) return null

    const { data: business } = await supabase
      .from("businesses")
      .select("industry, name")
      .eq("id", membership.business_id)
      .single()

    return business?.industry ?? null
  } catch {
    return null
  }
}

export default async function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  const rawIndustry = await resolveIndustry()
  const industryConfig = getIndustryConfig(rawIndustry)

  return (
    <div className="flex min-h-screen bg-[#F1F0F8]">
      <Sidebar industryConfig={industryConfig} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />

        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}