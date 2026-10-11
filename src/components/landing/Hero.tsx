"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import {
  ArrowRight,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"

export default function Hero() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 hero-glow" />
      <div className="pointer-events-none absolute top-1/4 right-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 left-0 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Header & Copy */}
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-600/20 bg-blue-50/80 px-4 py-1.5 shadow-sm backdrop-blur-md mb-8"
          >
            <Sparkles className="h-4 w-4 text-blue-600 animate-spin-slow" />
            <span className="text-xs font-semibold text-blue-700 tracking-wide uppercase">
              Autonomous Intelligence for Modern Commerce
            </span>
          </motion.div>

          <motion.h1
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl font-extrabold tracking-tight text-zinc-950 sm:text-6xl lg:text-7xl leading-[1.08]"
          >
            Don&apos;t just track numbers.{" "}
            <span className="gradient-heading-vibrant block sm:inline">
              Know why they move.
            </span>
          </motion.h1>

          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 sm:text-xl leading-relaxed"
          >
            Nexora unifies sales, inventory, suppliers, and finances into an executive
            intelligence engine with automated root-cause autopsy and predictive operational signals.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="mt-9 flex flex-col items-center justify-center gap-3.5 sm:flex-row"
          >
            <Link
              href="/signup"
              className="group inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl bg-zinc-950 px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-zinc-950/15 transition-all hover:bg-blue-600 hover:shadow-blue-600/25 active:scale-[0.98]"
            >
              Start Free Workspace
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-zinc-200/90 bg-white/90 px-7 py-4 text-sm font-semibold text-zinc-800 shadow-sm backdrop-blur-md transition-all hover:bg-zinc-50 hover:border-zinc-300 active:scale-[0.98]"
            >
              <Zap className="h-4 w-4 text-amber-500" />
              Live Interactive Demo
            </Link>
          </motion.div>

          {/* Feature Badges */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium text-zinc-500"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Direct POS & Database Sync
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Automated Business Autopsy
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              No Complex Setup Required
            </span>
          </motion.div>
        </div>

        {/* Product Visual Showcase with Scroll Animation */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 40, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-14 sm:mt-20 mx-auto max-w-5xl"
        >
          {/* Subtle Outer Frame / Glow */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600/20 via-indigo-500/20 to-cyan-500/20 blur-xl opacity-75" />

          {/* Main Showcase Panel */}
          <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/95 shadow-2xl shadow-zinc-950/10 backdrop-blur-xl">
            {/* Window bar */}
            <div className="flex h-11 items-center justify-between border-b border-zinc-100 bg-zinc-50/80 px-4 sm:px-6">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-400/80" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                <span className="ml-2 text-xs font-medium text-zinc-400 hidden sm:inline">nexora-intelligence-hub.app</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Operational Sync
              </div>
            </div>

            {/* Dashboard Content Mockup */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Top stats row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4 transition-all hover:bg-zinc-50">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>30-Day Net Revenue</span>
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-950">₹44,03,545</div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                    <span>+14.2%</span>
                    <span className="text-zinc-400">vs previous period</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4 transition-all hover:bg-zinc-50">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>Active Orders</span>
                    <Activity className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-950">187 Orders</div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                    <span>100% Fulfilled</span>
                    <span className="text-zinc-400">· 0 backlogs</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4 transition-all hover:bg-zinc-50">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>Diagnostic Signals</span>
                    <Layers className="h-3.5 w-3.5 text-indigo-600" />
                  </div>
                  <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-950">5 / 5 Healthy</div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                    <span>Autopsy active</span>
                    <span className="text-zinc-400">· Root-cause resolved</span>
                  </div>
                </div>
              </div>

              {/* Interactive Autopsy Diagnostic Pill Banner */}
              <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-950">
                      Business Autopsy Insight Generated
                    </h4>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      Revenue acceleration driven by Product #005 restock. Supplier lead times reduced by 2.4 days.
                    </p>
                  </div>
                </div>
                <Link
                  href="/autopsy"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm border border-blue-200/60 hover:bg-blue-50 transition-colors"
                >
                  View Full Autopsy <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Floating Accents */}
          <div className="hidden lg:block absolute -left-8 top-1/2 -translate-y-1/2 rounded-2xl border border-zinc-200/80 bg-white/95 p-3.5 shadow-xl backdrop-blur-md animate-float">
            <div className="flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-semibold text-zinc-900">Zero Inventory Stockouts</span>
            </div>
          </div>

          <div className="hidden lg:block absolute -right-8 bottom-12 rounded-2xl border border-zinc-200/80 bg-white/95 p-3.5 shadow-xl backdrop-blur-md animate-float" style={{ animationDelay: "2.5s" }}>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-semibold text-zinc-900">100% Workspace Isolated</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}