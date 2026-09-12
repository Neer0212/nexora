import Link from "next/link"
import { ArrowRight, Home } from "lucide-react"

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16">
      <div className="w-full max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">404 · Page not found</p>
        <h1 className="mt-5 text-5xl font-semibold tracking-tight text-zinc-950 sm:text-6xl">This page isn&apos;t here.</h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-zinc-500">The page may have moved, or the address may be incorrect.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-800"><Home className="h-4 w-4" />Back to Nexora</Link>
          <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-blue-600 transition hover:bg-zinc-200">Open dashboard<ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </main>
  )
}
