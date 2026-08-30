"use client"

import { useState } from "react"
import {
  ArrowRight,
  Brain,
  CircleAlert,
  Search,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react"

const stages = [
  {
    id: "understand",
    number: "01",
    title: "Understand",
    question: "What's happening?",
    description:
      "Nexora brings your business signals together and identifies the changes that actually matter.",
    icon: Search,
    insight:
      "Revenue is down 12.5% over the last 30 days.",
  },
  {
    id: "explain",
    number: "02",
    title: "Explain",
    question: "Why is it happening?",
    description:
      "Instead of leaving you with a number, Nexora traces the connected signals behind the change.",
    icon: Brain,
    insight:
      "The decline is mainly connected to lower product availability.",
  },
  {
    id: "predict",
    number: "03",
    title: "Predict",
    question: "What happens next?",
    description:
      "Nexora looks for patterns and connected signals that could affect your business next.",
    icon: TrendingUp,
    insight:
      "Supplier delays could affect two high-value products next week.",
  },
  {
    id: "decide",
    number: "04",
    title: "Decide",
    question: "What should I do?",
    description:
      "Turn business context into a clear direction so you can act with confidence.",
    icon: Target,
    insight:
      "Prioritise the supplier issue before inventory becomes critical.",
  },
]

export default function BrainSection() {
  const [activeStage, setActiveStage] = useState("understand")

  const active =
    stages.find((stage) => stage.id === activeStage) ?? stages[0]

  const ActiveIcon = active.icon

  return (
    <section
      id="intelligence"
      className="relative scroll-mt-24 overflow-hidden bg-[#2D232E] py-16 text-[#F1F0EA] sm:py-20"
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute -left-64 top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-[#534B52]/25 blur-3xl" />

      <div className="pointer-events-none absolute -right-64 -top-40 h-[500px] w-[500px] rounded-full bg-[#474448]/25 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Section heading */}
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-[#F1F0EA]/10 bg-[#F1F0EA]/5 px-3 py-2">
              <Sparkles className="h-3.5 w-3.5 text-[#E0DDCF]" />

              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#E0DDCF]/65">
                Business intelligence
              </span>
            </div>

            <h2 className="mt-6 text-4xl font-semibold leading-[1.02] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              From data to
              <span className="block text-[#E0DDCF]">
                decisions.
              </span>
            </h2>
          </div>

          <p className="max-w-xl text-sm leading-6 text-[#E0DDCF]/60 sm:text-base">
            Nexora doesn&apos;t just show you numbers. It helps you understand
            what they mean, what caused them, what could happen next, and
            where to go from there.
          </p>
        </div>

        {/* Interactive intelligence panel */}
        <div className="mt-10 overflow-hidden rounded-[30px] border border-[#F1F0EA]/10 bg-[#F1F0EA]/[0.035] backdrop-blur-sm sm:mt-12">
          <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
            {/* Stage selector */}
            <div className="border-b border-[#F1F0EA]/10 p-4 sm:p-6 lg:border-b-0 lg:border-r">
              <p className="mb-3 px-2 text-[9px] font-medium uppercase tracking-[0.16em] text-[#E0DDCF]/35">
                How Nexora thinks
              </p>

              <div className="space-y-2">
                {stages.map((stage) => {
                  const Icon = stage.icon
                  const isActive = stage.id === activeStage

                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => setActiveStage(stage.id)}
                      className={[
                        "group w-full rounded-2xl border p-4 text-left transition-all duration-200",
                        isActive
                          ? "border-[#F1F0EA]/15 bg-[#F1F0EA]/10"
                          : "border-transparent hover:border-[#F1F0EA]/10 hover:bg-[#F1F0EA]/[0.06]",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={[
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
                            isActive
                              ? "border-[#E0DDCF]/15 bg-[#E0DDCF]/10 text-[#E0DDCF]"
                              : "border-[#F1F0EA]/10 bg-[#F1F0EA]/5 text-[#E0DDCF]/50 group-hover:bg-[#E0DDCF]/10 group-hover:text-[#E0DDCF]",
                          ].join(" ")}
                        >
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <span
                              className={[
                                "text-sm font-medium transition-colors",
                                isActive
                                  ? "text-[#F1F0EA]"
                                  : "text-[#E0DDCF]/65 group-hover:text-[#F1F0EA]",
                              ].join(" ")}
                            >
                              {stage.title}
                            </span>

                            <span className="text-[9px] tracking-[0.12em] text-[#E0DDCF]/30">
                              {stage.number}
                            </span>
                          </div>

                          <p className="mt-1 text-[10px] text-[#E0DDCF]/40">
                            {stage.question}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Active stage */}
            <div className="relative min-h-[420px] p-6 sm:p-8 lg:p-10">
              {/* Small header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#E0DDCF]" />

                  <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#E0DDCF]/50">
                    Live business context
                  </span>
                </div>

                <span className="text-[9px] uppercase tracking-[0.16em] text-[#E0DDCF]/25">
                  Nexora
                </span>
              </div>

              {/* Main content */}
              <div key={active.id} className="mt-12 max-w-2xl nexora-content-enter">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#F1F0EA]/10 bg-[#F1F0EA]/5">
                  <ActiveIcon className="h-5 w-5 text-[#E0DDCF]" />
                </div>

                <p className="mt-7 text-[10px] font-medium uppercase tracking-[0.18em] text-[#E0DDCF]/40">
                  {active.question}
                </p>

                <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#F1F0EA] sm:text-4xl">
                  {active.title}.
                </h3>

                <p className="mt-4 max-w-xl text-sm leading-6 text-[#E0DDCF]/55 sm:text-base">
                  {active.description}
                </p>
              </div>

              {/* Insight card */}
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-[#F1F0EA]/10 bg-[#F1F0EA]/[0.055] p-5 sm:bottom-8 sm:left-8 sm:right-8">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E0DDCF]/10">
                    {activeStage === "understand" && (
                      <Search className="h-4 w-4 text-[#E0DDCF]" />
                    )}

                    {activeStage === "explain" && (
                      <Brain className="h-4 w-4 text-[#E0DDCF]" />
                    )}

                    {activeStage === "predict" && (
                      <TrendingUp className="h-4 w-4 text-[#E0DDCF]" />
                    )}

                    {activeStage === "decide" && (
                      <Target className="h-4 w-4 text-[#E0DDCF]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-[#E0DDCF]/40">
                      Nexora noticed
                    </p>

                    <p className="mt-1 text-sm leading-5 text-[#F1F0EA]/85">
                      {active.insight}
                    </p>
                  </div>

                  <ArrowRight className="ml-auto mt-1 h-4 w-4 shrink-0 text-[#E0DDCF]/35" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom status */}
          <div className="flex flex-col gap-3 border-t border-[#F1F0EA]/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="flex items-center gap-2">
              <CircleAlert className="h-3.5 w-3.5 text-[#E0DDCF]/45" />

              <span className="text-[10px] text-[#E0DDCF]/45">
                Nexora continuously connects signals across your business.
              </span>
            </div>

            <a
              href="#business-types"
              className="group inline-flex items-center gap-2 text-[10px] font-medium text-[#E0DDCF]/65 transition hover:text-[#F1F0EA]"
            >
              Explore connected business areas

              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {/* Bottom points */}
        <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3">
          {[
            "One connected view",
            "Explain the why",
            "Decide with confidence",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 text-xs text-[#E0DDCF]/55"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#E0DDCF]/50" />

              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}