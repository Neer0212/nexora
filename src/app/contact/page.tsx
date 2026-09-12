import Link from "next/link"
import type { Metadata } from "next"
import Breadcrumbs from "@/components/layout/Breadcrumbs"

export const metadata: Metadata = {
  title: "Contact Nexora",
  description: "Have a question about Nexora or want to talk about your business data?",
  alternates: { canonical: "/contact" },
}

export default function Page() {
  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-28 text-zinc-950">
      <div className="mx-auto max-w-3xl">
        <Breadcrumbs items={[{ label: "Contact Nexora" }]} />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Nexora</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Contact Nexora</h1>
        <p className="mt-5 text-lg leading-8 text-zinc-500">Have a question about Nexora or want to talk about your business data?</p>
        <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 text-sm leading-7 text-[#534B52] sm:p-8">
          <p>For product questions, early access, partnerships, or feedback, this page provides a direct place to start a conversation with the Nexora team.</p>
        </section>
        <Link href="/" className="mt-7 inline-flex text-sm font-medium text-blue-800 hover:text-blue-600">
          Back to Nexora
        </Link>
      </div>
    </main>
  )
}
