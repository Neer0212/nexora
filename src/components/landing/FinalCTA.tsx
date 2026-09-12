import Link from "next/link"
import {
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react"

export default function FinalCTA() {
  return (
    <section
      id="final-cta"
      className="relative overflow-hidden bg-zinc-950 py-20 text-zinc-50 sm:py-24"
    >
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute -left-48 -top-48 h-[600px] w-[600px] rounded-full bg-blue-600/25 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-48 -right-48 h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-6 text-center">
        {/* Label */}
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/15 bg-zinc-50/5 px-3.5 py-2">
          <Sparkles className="h-3.5 w-3.5 text-blue-200" />

          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-blue-200/65">
            Your business, understood
          </span>
        </div>

        {/* Heading */}
        <h2 className="mx-auto mt-7 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl lg:text-7xl">
          Your business is already
          <span className="block text-blue-200">
            telling you what to do.
          </span>
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-blue-200/65 sm:text-lg">
          Nexora helps you understand what&apos;s happening, why it matters,
          and what to do next.
        </p>

        {/* CTA */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-50 px-6 py-3.5 text-sm font-medium text-zinc-950 shadow-sm transition hover:bg-blue-200"
          >
            Start with your business

            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-50/15 px-6 py-3.5 text-sm font-medium text-zinc-50/80 transition hover:border-zinc-50/25 hover:bg-zinc-50/5 hover:text-zinc-50"
          >
            Already have an account?
          </Link>
        </div>

        {/* Trust points */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          {[
            "Connect your existing data",
            "No complicated setup",
            "Built around your business",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-1.5 text-[10px] text-blue-200/50"
            >
              <Check className="h-3 w-3 text-blue-200/70" />

              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}