"use client"

import { motion, useReducedMotion } from "motion/react"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileSearch,
  Sparkles,
  TrendingDown,
  Truck,
  Package,
} from "lucide-react"
import Link from "next/link"

const autopsySteps = [
  {
    stage: "Primary Alert Detected",
    title: "Net Sales dropped 11.2% in 30 days",
    detail: "System triggered diagnostic scan across orders, catalogue, and purchase feeds.",
    status: "critical",
    icon: TrendingDown,
    color: "text-rose-600 bg-rose-50 border-rose-200",
  },
  {
    stage: "Volume vs Price Analysis",
    title: "Order volume stable (+1.1%), but stockout on Top SKU",
    detail: "Item #005 contributed 42% of revenue last month and spent 14 days out-of-stock.",
    status: "root-cause",
    icon: Package,
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  {
    stage: "Supply Chain Trace",
    title: "Supplier lead time delayed by 3.8 days",
    detail: "Purchase order PO-20260812 was delayed by vendor, creating the stock depletion.",
    status: "solution",
    icon: Truck,
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
]

export default function AutopsySection() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-zinc-50 py-24 sm:py-32 border-t border-zinc-200/80"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            className="inline-flex items-center gap-2 rounded-full border border-rose-600/20 bg-rose-50 px-4 py-1.5 text-xs font-semibold text-rose-700"
          >
            <FileSearch className="h-4 w-4 text-rose-600" />
            Deterministic Diagnostic Engine
          </motion.div>

          <motion.h2
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-5xl"
          >
            Business Autopsy: Root cause, unmasked.
          </motion.h2>

          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 text-base sm:text-lg leading-relaxed text-zinc-600"
          >
            When key metrics fluctuate, Nexora works backwards through your transactional ledger to pinpoint the exact operational driver.
          </motion.p>
        </div>

        {/* Visual Root-Cause Diagnosis Showcase */}
        <div className="mt-16 mx-auto max-w-4xl">
          <div className="relative space-y-4">
            {autopsySteps.map((step, idx) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.title}
                  initial={shouldReduceMotion ? false : { opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                  className="relative rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-7 shadow-sm transition-all hover:shadow-md hover:border-zinc-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${step.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                          Step 0{idx + 1} · {step.stage}
                        </span>
                        <h4 className="mt-1 text-base sm:text-lg font-bold text-zinc-950">
                          {step.title}
                        </h4>
                        <p className="mt-1 text-sm text-zinc-600 leading-relaxed">
                          {step.detail}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-zinc-100 text-zinc-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                        Verified
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Action CTA */}
          <div className="mt-10 text-center">
            <Link
              href="/autopsy"
              className="inline-flex items-center gap-2 rounded-2xl bg-zinc-950 px-7 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-all active:scale-[0.98]"
            >
              Run an Autopsy on Your Store <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}