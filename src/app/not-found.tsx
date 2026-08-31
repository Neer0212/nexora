import Link from "next/link"
import { ArrowRight, Home } from "lucide-react"

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F1F0F8] px-6 py-16">
      <div className="w-full max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#433D8B]">404 · Page not found</p>
        <h1 className="mt-5 text-5xl font-semibold tracking-[-0.05em] text-[#17153B] sm:text-6xl">This page isn&apos;t here.</h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-[#68647A]">The page may have moved, or the address may be incorrect.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17153B] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#2E236C]"><Home className="h-4 w-4" />Back to Nexora</Link>
          <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E7E4EF] bg-white px-5 py-3 text-sm font-medium text-[#433D8B] transition hover:bg-[#E7E4EF]">Open dashboard<ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </main>
  )
}
