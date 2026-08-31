import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import Breadcrumbs from "@/components/layout/Breadcrumbs"

export default async function DashboardPage() {
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
    <main className="min-h-screen bg-[#F1F0F8]">
      <header className="border-b border-[#E7E4EF] bg-[#FFFFFF]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-semibold tracking-wide text-blue-600">
              NEXORA
            </p>

            <p className="mt-1 text-xl font-semibold text-[#17153B]">
              {business.name}
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-[#433D8B]">{user.email}</p>

            <p className="mt-1 text-xs capitalize text-[#9A94A8]">
              {membership.role}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <Breadcrumbs items={[{ label: "Business overview" }]} />

        <div className="mb-10">
          <p className="text-sm font-medium text-blue-600">
            Business workspace
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#17153B]">
            Business overview
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#68647A]">
            Nexora will turn your business data into a clearer picture of
            what is happening, why it is happening, and what you should do
            next.
          </p>
        </div>

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#E7E4EF] bg-[#FFFFFF] p-5">
            <p className="text-sm text-[#68647A]">Business</p>
            <p className="mt-2 font-semibold text-[#17153B]">
              {business.name}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E7E4EF] bg-[#FFFFFF] p-5">
            <p className="text-sm text-[#68647A]">Industry</p>
            <p className="mt-2 font-semibold text-[#17153B]">
              {business.industry || "Not specified"}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E7E4EF] bg-[#FFFFFF] p-5">
            <p className="text-sm text-[#68647A]">Business type</p>
            <p className="mt-2 font-semibold text-[#17153B]">
              {business.business_type || "Not specified"}
            </p>
          </div>

          <div className="rounded-2xl border border-[#E7E4EF] bg-[#FFFFFF] p-5">
            <p className="text-sm text-[#68647A]">Currency</p>
            <p className="mt-2 font-semibold text-[#17153B]">
              {business.currency_code}
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-dashed border-[#D9D5E4] bg-[#FFFFFF] p-8">
          <p className="text-sm font-medium text-[#17153B]">
            Your workspace is ready.
          </p>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68647A]">
            The next step is connecting your business data. Once data is
            available, this workspace will become the foundation for Nexora&apos;s
            analytics, Business Brain, and recommendations.
          </p>
        </section>
      </div>
    </main>
  )
}