import Link from "next/link"
import type { Metadata } from "next"
import Breadcrumbs from "@/components/layout/Breadcrumbs"

export const metadata: Metadata = {
  title: "About Nexora",
  description: "Nexora is being built to make business data easier to understand and act on.",
  alternates: { canonical: "/about" },
}

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-28 text-zinc-950">
      <div className="mx-auto max-w-3xl">
        <Breadcrumbs items={[{ label: "About Nexora" }]} />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Nexora</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">About Nexora</h1>
        <p className="mt-5 text-lg leading-8 text-zinc-500">Nexora is being built to make business data easier to understand and act on.</p>
        <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 text-sm leading-7 text-[#534B52] sm:p-8">
          <p>Nexora brings operational signals into one connected context so business teams can spend less time reconciling spreadsheets and more time making informed decisions.</p>
        </section>
        <Link href="/" className="mt-7 inline-flex text-sm font-medium text-blue-800 hover:text-blue-600">
          Back to Nexora
        </Link>
      </div>
    </main>
  )
}
