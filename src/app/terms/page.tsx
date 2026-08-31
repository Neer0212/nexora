import Link from "next/link"
import type { Metadata } from "next"
import Breadcrumbs from "@/components/layout/Breadcrumbs"

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The basic terms for using Nexora.",
  alternates: { canonical: "/terms" },
}

export default function Page() {
  return (
    <main className="min-h-screen bg-[#F1F0F8] px-6 py-28 text-[#17153B]">
      <div className="mx-auto max-w-3xl">
        <Breadcrumbs items={[{ label: "Terms of use" }]} />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#433D8B]">Nexora</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Terms of use</h1>
        <p className="mt-5 text-lg leading-8 text-[#68647A]">The basic terms for using Nexora.</p>
        <section className="mt-8 rounded-2xl border border-[#E7E4EF] bg-white p-6 text-sm leading-7 text-[#534B52] sm:p-8">
          <p>Nexora is currently in product development. Final terms covering accounts, acceptable use, data processing, subscriptions, and service limitations will be published before production launch.</p>
        </section>
        <Link href="/" className="mt-7 inline-flex text-sm font-medium text-[#2E236C] hover:text-[#433D8B]">
          Back to Nexora
        </Link>
      </div>
    </main>
  )
}
