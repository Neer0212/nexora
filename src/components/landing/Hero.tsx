import Link from "next/link"
import {
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react"

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-zinc-50 pt-32 pb-24 sm:pt-40 sm:pb-32">
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 shadow-sm mb-8">
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          <span className="text-xs font-medium text-zinc-950">
            Business intelligence, connected
          </span>
        </div>

        <h1 className="text-[54px] font-semibold leading-[1.05] tracking-tight text-zinc-950 sm:text-[72px]">
          Understand. Decide. Grow.
        </h1>

        <p className="mx-auto mt-8 max-w-2xl text-[17px] leading-8 text-zinc-600">
          Nexora brings your business data together, reveals what is
          changing, explains why it matters, and helps you decide what to
          do next.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-6 py-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-800"
          >
            Start with your business
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <a
            href="#product"
            className="inline-flex items-center justify-center rounded-xl bg-white border border-zinc-200 px-6 py-3.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-50"
          >
            See how it works
          </a>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4">
          {[
            "One connected view",
            "Explain the why",
            "Decide with confidence",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 text-sm font-medium text-zinc-600"
            >
              <Check className="h-4 w-4 text-zinc-950" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}