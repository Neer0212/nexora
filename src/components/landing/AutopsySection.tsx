"use client"

import { useState } from "react"
import {
  ArrowRight,
  ChevronDown,
  CircleAlert,
  Search,
  Sparkles,
  TrendingDown,
} from "lucide-react"

const factors = [
  {
    title: "Product A availability",
    impact: "−18.7%",
    contribution: "42%",
    description:
      "Stock availability fell after supplier lead times increased.",
  },
  {
    title: "West region orders",
    impact: "−11.2%",
    contribution: "27%",
    description:
      "Order volume declined primarily across the West region.",
  },
  {
    title: "Supplier lead time",
    impact: "+2.4 days",
    contribution: "19%",
    description:
      "Average delivery time increased compared with the previous period.",
  },
]

export default function AutopsySection() {
  const [expanded, setExpanded] = useState<number | null>(0)

  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-24 overflow-hidden bg-[#F1F0EA] py-16 sm:py-20"
    >
      <div className="pointer-events-none absolute right-[-180px] top-20 h-[500px] w-[500px] rounded-full bg-[#E0DDCF]/45 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Heading */}
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#534B52]/15 bg-white/50 px-3.5 py-2">
              <Search className="h-3.5 w-3.5 text-[#534B52]" />

              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#534B52]">
                Business autopsy
              </span>
            </div>

            <h2 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-[-0.045em] text-[#2D232E] sm:text-5xl lg:text-6xl">
              Don&apos;t just see
              <span className="block text-[#534B52]">
                what changed.
              </span>
              <span className="block">Know why.</span>
            </h2>
          </div>

          <div className="max-w-xl">
            <p className="text-base leading-7 text-[#534B52] sm:text-lg">
              When an important number moves, Nexora works backwards through
              your business data to identify the signals that matter.
            </p>

            <p className="mt-3 text-sm leading-6 text-[#534B52]/65">
              No endless spreadsheet comparisons. No guessing. Just a clear
              explanation of what is driving the change.
            </p>
          </div>
        </div>

        {/* Autopsy interface */}
        <div className="mt-8 overflow-hidden rounded-[30px] sm:mt-10 border border-[#534B52]/15 bg-white shadow-[0_25px_70px_rgba(45,35,46,0.10)] sm:mt-12">
          {/* Header */}
          <div className="flex flex-col gap-4 border-b border-[#534B52]/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E0DDCF]/60">
                <TrendingDown className="h-4 w-4 text-[#474448]" />
              </div>

              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#534B52]/50">
                  Revenue analysis
                </p>

                <p className="mt-0.5 text-sm font-semibold text-[#2D232E]">
                  Something changed.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-[#534B52]/10 px-3 py-2 text-[9px] text-[#534B52]/60">
                Previous 30 days
              </span>

              <span className="rounded-lg bg-[#E0DDCF]/50 px-3 py-2 text-[9px] font-medium text-[#474448]">
                Investigating
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-[0.75fr_1.25fr]">
            {/* Left */}
            <div className="border-b border-[#534B52]/10 bg-[#F1F0EA]/45 p-6 sm:p-8 lg:border-b-0 lg:border-r">
              <p className="text-[9px] uppercase tracking-[0.16em] text-[#534B52]/50">
                Revenue
              </p>

              <div className="mt-5 flex items-end gap-3">
                <span className="text-5xl font-semibold tracking-[-0.06em] text-[#2D232E]">
                  ₹21.7L
                </span>

                <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-[#E0DDCF]/70 px-2 py-1 text-[9px] font-medium text-[#474448]">
                  <TrendingDown className="h-3 w-3" />
                  12.5%
                </span>
              </div>

              <p className="mt-3 max-w-xs text-xs leading-5 text-[#534B52]/60">
                Revenue is down compared with the previous 30-day period.
              </p>

              <div className="mt-8">
                <div className="flex h-28 items-end gap-1">
                  {[80, 84, 76, 89, 82, 78, 73, 69, 63, 60, 53, 46].map(
                    (height, index) => (
                      <div
                        key={index}
                        className="flex-1 rounded-t-sm bg-[#534B52]/20"
                        style={{ height: `${height}%` }}
                      />
                    )
                  )}
                </div>

                <div className="mt-3 flex justify-between text-[8px] uppercase tracking-[0.1em] text-[#534B52]/35">
                  <span>30 days ago</span>
                  <span>Today</span>
                </div>
              </div>

              <div className="mt-7 rounded-xl border border-[#534B52]/10 bg-white p-4">
                <div className="flex items-center gap-2">
                  <CircleAlert className="h-3.5 w-3.5 text-[#534B52]" />

                  <span className="text-[10px] font-medium text-[#474448]">
                    Nexora detected a meaningful change
                  </span>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="p-6 sm:p-8">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-[#534B52]" />

                  <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-[#534B52]/50">
                    Nexora&apos;s analysis
                  </span>
                </div>

                <h3 className="mt-3 max-w-lg text-xl font-semibold tracking-[-0.03em] text-[#2D232E] sm:text-2xl">
                  The decline is mainly connected to product availability.
                </h3>

                <p className="mt-3 max-w-lg text-xs leading-5 text-[#534B52]/60">
                  Nexora traced the change across inventory, orders, supplier
                  performance, and regional demand.
                </p>
              </div>

              {/* Factors */}
              <div className="mt-6 space-y-2">
                {factors.map((factor, index) => {
                  const isExpanded = expanded === index

                  return (
                    <div
                      key={factor.title}
                      className="overflow-hidden rounded-xl border border-[#534B52]/10 bg-[#F1F0EA]/35"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded(isExpanded ? null : index)
                        }
                        className="flex w-full items-center gap-3 p-4 text-left"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[9px] font-medium text-[#534B52]">
                          0{index + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-[#2D232E]">
                            {factor.title}
                          </p>

                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E0DDCF]/60">
                            <div
                              className="h-full rounded-full bg-[#534B52]/45"
                              style={{ width: factor.contribution }}
                            />
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          <span className="hidden text-[9px] text-[#534B52]/50 sm:block">
                            {factor.contribution}
                          </span>

                          <span className="text-[10px] font-semibold text-[#474448]">
                            {factor.impact}
                          </span>

                          <ChevronDown
                            className={[
                              "h-3.5 w-3.5 text-[#534B52]/45 transition-transform",
                              isExpanded ? "rotate-180" : "",
                            ].join(" ")}
                          />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-[#534B52]/10 px-4 pb-4 pt-3 pl-14">
                          <p className="text-[10px] leading-5 text-[#534B52]/65">
                            {factor.description}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Finding */}
              <div className="mt-5 rounded-2xl bg-[#2D232E] p-5 text-[#F1F0EA]">
                <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-[#E0DDCF]/50">
                  The finding
                </p>

                <p className="mt-2 text-sm font-medium leading-5">
                  Longer supplier lead times reduced Product A availability,
                  which contributed to lower orders in the West region.
                </p>

                <div className="mt-4 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#E0DDCF]" />

                  <span className="text-[9px] text-[#E0DDCF]/55">
                    Connected across 4 business signals
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Closing statement */}
        <div className="mt-8 flex flex-col gap-4 border-t sm:mt-10 border-[#534B52]/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-medium tracking-tight text-[#2D232E]">
              Numbers tell you what happened.
            </p>

            <p className="mt-1 text-base font-medium tracking-tight text-[#534B52]">
              Context tells you why.
            </p>
          </div>

          <a
            href="#business-types"
            className="group inline-flex items-center gap-2 text-sm font-medium text-[#474448]"
          >
            See what Nexora can connect

            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  )
}