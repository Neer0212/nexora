import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

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
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-semibold tracking-wide text-blue-600">
              NEXORA
            </p>

            <h1 className="mt-1 text-xl font-semibold text-slate-900">
              {business.name}
            </h1>
          </div>

          <div className="text-right">
            <p className="text-sm text-slate-700">{user.email}</p>

            <p className="mt-1 text-xs capitalize text-slate-400">
              {membership.role}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10">
          <p className="text-sm font-medium text-blue-600">
            Business workspace
          </p>

          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Good to have you here.
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Nexora will turn your business data into a clearer picture of
            what is happening, why it is happening, and what you should do
            next.
          </p>
        </div>

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Business</p>
            <p className="mt-2 font-semibold text-slate-900">
              {business.name}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Industry</p>
            <p className="mt-2 font-semibold text-slate-900">
              {business.industry || "Not specified"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Business type</p>
            <p className="mt-2 font-semibold text-slate-900">
              {business.business_type || "Not specified"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Currency</p>
            <p className="mt-2 font-semibold text-slate-900">
              {business.currency_code}
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8">
          <p className="text-sm font-medium text-slate-900">
            Your workspace is ready.
          </p>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            The next step is connecting your business data. Once data is
            available, this workspace will become the foundation for Nexora&apos;s
            analytics, Business Brain, and recommendations.
          </p>
        </section>
      </div>
    </main>
  )
}