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
      className="relative overflow-hidden bg-[#17153B] py-20 text-[#F1F0F8] sm:py-24"
    >
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute -left-48 -top-48 h-[600px] w-[600px] rounded-full bg-[#433D8B]/25 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-48 -right-48 h-[600px] w-[600px] rounded-full bg-[#433D8B]/20 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-6 text-center">
        {/* Label */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#C8ACD6]/15 bg-[#F1F0F8]/5 px-3.5 py-2">
          <Sparkles className="h-3.5 w-3.5 text-[#C8ACD6]" />

          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#C8ACD6]/65">
            Your business, understood
          </span>
        </div>

        {/* Heading */}
        <h2 className="mx-auto mt-7 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-7xl">
          Your business is already
          <span className="block text-[#C8ACD6]">
            telling you what to do.
          </span>
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#C8ACD6]/65 sm:text-lg">
          Nexora helps you understand what&apos;s happening, why it matters,
          and what to do next.
        </p>

        {/* CTA */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#F1F0F8] px-6 py-3.5 text-sm font-medium text-[#17153B] shadow-[0_12px_35px_rgba(0,0,0,0.16)] transition hover:bg-[#C8ACD6]"
          >
            Start with your business

            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl border border-[#F1F0F8]/15 px-6 py-3.5 text-sm font-medium text-[#F1F0F8]/80 transition hover:border-[#F1F0F8]/25 hover:bg-[#F1F0F8]/5 hover:text-[#F1F0F8]"
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
              className="flex items-center gap-1.5 text-[10px] text-[#C8ACD6]/50"
            >
              <Check className="h-3 w-3 text-[#C8ACD6]/70" />

              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}