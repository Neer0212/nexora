"use client"

import { motion, useReducedMotion } from "motion/react"
import {
  Brain,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"

const stages = [
  {
    id: "understand",
    number: "01",
    title: "Understand",
    question: "What's happening right now?",
    description:
      "Nexora aggregates real-time transactions, stock, and returns to give you continuous clarity.",
    icon: Search,
    color: "from-blue-500 to-cyan-500",
    badge: "Operational Truth",
  },
  {
    id: "explain",
    number: "02",
    title: "Explain",
    question: "Why did metrics shift?",
    description:
      "No guessing why revenue dropped. The system isolates price, volume, returns, and delivery lags.",
    icon: Brain,
    color: "from-indigo-500 to-purple-500",
    badge: "Root-Cause Autopsy",
  },
  {
    id: "predict",
    number: "03",
    title: "Predict",
    question: "What's the next bottleneck?",
    description:
      "Deterministic lead-time and reorder thresholds surface stockout risks before shelves empty.",
    icon: TrendingUp,
    color: "from-amber-500 to-rose-500",
    badge: "Early Warning",
  },
  {
    id: "decide",
    number: "04",
    title: "Decide",
    question: "What action should you take?",
    description:
      "Receive concrete operational recommendations to restock, renegotiate, or adjust pricing.",
    icon: Target,
    color: "from-emerald-500 to-teal-500",
    badge: "Executive Action",
  },
]

export default function BrainSection() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section className="relative overflow-hidden bg-zinc-950 text-white py-24 sm:py-32">
      {/* Dark atmospheric lighting */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-1.5 text-xs font-semibold text-zinc-300 backdrop-blur-md"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            The Nexora Reasoning Loop
          </motion.div>

          <motion.h2
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl"
          >
            From raw signal to decisive action.
          </motion.h2>

          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 text-base sm:text-lg leading-relaxed text-zinc-400"
          >
            Traditional analytics just show backward-looking dashboards. Business Brain actively reasons across your entire enterprise graph.
          </motion.p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stages.map((stage, idx) => {
            const Icon = stage.icon
            return (
              <motion.div
                key={stage.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group relative rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-7 backdrop-blur-md transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/90 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-800/80 text-white shadow-inner group-hover:scale-105 transition-transform">
                    <Icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <span className="font-mono text-xs font-bold text-zinc-500">
                    {stage.number}
                  </span>
                </div>

                <div className="mt-6">
                  <span className="inline-block rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                    {stage.badge}
                  </span>
                  <h3 className="mt-2 text-xl font-bold tracking-tight text-white">
                    {stage.title}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-blue-400">
                    {stage.question}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                    {stage.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom Banner */}
        <div className="mt-14 text-center">
          <Link
            href="/brain"
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all active:scale-[0.98]"
          >
            Launch Business Brain <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}