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
    <main className="min-h-screen bg-zinc-50 px-6 py-28 text-zinc-950">
      <div className="mx-auto max-w-3xl">
        <Breadcrumbs items={[{ label: "Terms of use" }]} />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Nexora</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Terms of use</h1>
        <p className="mt-5 text-lg leading-8 text-zinc-500">The basic terms for using Nexora.</p>
        <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 text-sm leading-7 text-[#534B52] sm:p-8">
          <p>Nexora is currently in product development. Final terms covering accounts, acceptable use, data processing, subscriptions, and service limitations will be published before production launch.</p>
        </section>
        <Link href="/" className="mt-7 inline-flex text-sm font-medium text-blue-800 hover:text-blue-600">
          Back to Nexora
        </Link>
      </div>
    </main>
  )
}
