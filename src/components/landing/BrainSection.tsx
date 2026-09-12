"use client"

import {
  Brain,
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
  return (
    <section
      id="intelligence"
      className="bg-zinc-950 py-24 text-zinc-50 sm:py-32"
    >
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3.5 py-1.5 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs font-medium text-zinc-300">
                Business intelligence
              </span>
            </div>

            <h2 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              From data to decisions.
            </h2>
            <p className="mt-6 text-lg leading-8 text-zinc-400">
              Nexora doesn't just show you numbers. It helps you understand
              what they mean, what caused them, what could happen next, and
              where to go from there.
            </p>
          </div>

          <div className="space-y-4">
            {stages.map((stage) => {
              const Icon = stage.icon
              return (
                <div
                  key={stage.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-zinc-100">
                        {stage.title} <span className="text-zinc-500 font-normal ml-1">— {stage.question}</span>
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {stage.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}