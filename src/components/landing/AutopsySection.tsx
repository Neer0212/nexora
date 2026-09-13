"use client"

import {
  ArrowRight,
  Search,
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
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-zinc-50 py-24 sm:py-32 border-t border-zinc-200"
    >
      <div className="relative mx-auto max-w-5xl px-6">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 mb-6">
            <Search className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-xs font-medium uppercase tracking-widest text-zinc-950">
              Business Autopsy
            </span>
          </div>

          <h2 className="text-4xl font-semibold leading-tight tracking-tight text-zinc-950 sm:text-5xl max-w-2xl">
            Don&apos;t just see what changed. Know why.
          </h2>

          <p className="mt-6 text-lg leading-8 text-zinc-600 max-w-2xl">
            When an important number moves, Nexora works backwards through
            your business data to identify the signals that matter. No endless spreadsheet comparisons. No guessing. Just a clear explanation of what is driving the change.
          </p>
        </div>

        <div className="mt-16 bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 sm:p-8 border-b border-zinc-200">
            <h3 className="text-xl font-semibold text-zinc-950">
              The decline is mainly connected to product availability.
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Nexora traced the change across inventory, orders, supplier performance, and regional demand.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-6 py-4 font-semibold text-zinc-500 border-b border-zinc-200">Factor</th>
                  <th className="px-6 py-4 font-semibold text-zinc-500 border-b border-zinc-200">Impact</th>
                  <th className="px-6 py-4 font-semibold text-zinc-500 border-b border-zinc-200">Contribution</th>
                  <th className="px-6 py-4 font-semibold text-zinc-500 border-b border-zinc-200 w-full">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {factors.map((factor) => (
                  <tr key={factor.title} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-950">{factor.title}</td>
                    <td className="px-6 py-4 text-zinc-950 font-medium">{factor.impact}</td>
                    <td className="px-6 py-4 text-zinc-600">{factor.contribution}</td>
                    <td className="px-6 py-4 text-zinc-600 truncate max-w-xs md:max-w-md">{factor.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg font-medium text-zinc-950">
            Numbers tell you what happened. <span className="text-zinc-500">Context tells you why.</span>
          </p>

          <a
            href="#business-types"
            className="group inline-flex items-center gap-2 text-sm font-medium text-zinc-950 hover:text-blue-600 transition-colors"
          >
            See what Nexora can connect
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  )
}