import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Breadcrumbs from "@/components/layout/Breadcrumbs"
import { User, Building2, Shield, Mail, Calendar } from "lucide-react"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: membership } = await supabase
    .from("business_users")
    .select("business_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  if (!membership) redirect("/onboarding")

  const { data: business } = await supabase
    .from("businesses")
    .select("name, industry, business_type, currency_code, created_at")
    .eq("id", membership.business_id)
    .single()

  const initial = (user.email ?? "U")[0].toUpperCase()
  const joinDate = user.created_at
    ? new Intl.DateTimeFormat("en-IN", { year: "numeric", month: "long", day: "numeric" }).format(
        new Date(user.created_at)
      )
    : "—"

  const roleLabel =
    membership.role === "owner"
      ? "Owner"
      : membership.role === "admin"
        ? "Admin"
        : "Member"

  return (
    <main className="min-h-screen bg-[#F1F0F8]">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: "Profile" }]} />

        <div className="mt-4 space-y-6">
          {/* Profile Header */}
          <div className="rounded-2xl border border-[#E7E4EF] bg-white p-6 shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#433D8B] text-xl font-bold text-white">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-[#17153B]">
                  {user.user_metadata?.full_name ?? user.email ?? "Nexora User"}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[#68647A]">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="rounded-2xl border border-[#E7E4EF] bg-white p-6 shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#433D8B]">
              Account
            </p>
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-[#68647A]" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-[#9A94A8]">
                    Email
                  </p>
                  <p className="text-sm text-[#17153B]">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-[#68647A]" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-[#9A94A8]">
                    Joined
                  </p>
                  <p className="text-sm text-[#17153B]">{joinDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-[#68647A]" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-[#9A94A8]">
                    Role
                  </p>
                  <p className="text-sm text-[#17153B]">{roleLabel}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Workspace Details */}
          {business && (
            <div className="rounded-2xl border border-[#E7E4EF] bg-white p-6 shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#433D8B]">
                Workspace
              </p>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-[#68647A]" />
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-widest text-[#9A94A8]">
                      Business
                    </p>
                    <p className="text-sm text-[#17153B]">{business.name}</p>
                  </div>
                </div>
                {business.industry && (
                  <div className="pl-7">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-[#9A94A8]">
                      Industry
                    </p>
                    <p className="text-sm text-[#17153B]">{business.industry}</p>
                  </div>
                )}
                {business.business_type && (
                  <div className="pl-7">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-[#9A94A8]">
                      Type
                    </p>
                    <p className="text-sm capitalize text-[#17153B]">{business.business_type}</p>
                  </div>
                )}
                <div className="pl-7">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-[#9A94A8]">
                    Currency
                  </p>
                  <p className="text-sm text-[#17153B]">{business.currency_code}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
