"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight, Sparkles } from "lucide-react"

export default function FinalCTA() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section className="relative overflow-hidden bg-zinc-950 text-white py-24 sm:py-32">
      {/* Radiant glow effect */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(37,99,235,0.2),transparent)]" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/90 px-4 py-1.5 text-xs font-semibold text-zinc-300 backdrop-blur-md mb-8">
            <Sparkles className="h-4 w-4 text-blue-400" />
            Get Started in Under 2 Minutes
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight sm:text-6xl max-w-3xl mx-auto leading-tight">
            Ready to bring clarity to your business?
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-400 leading-relaxed">
            Create your account today. Connect your store, inventory, and supplier channels in one unified, intelligent workspace.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-bold text-zinc-950 shadow-lg hover:bg-zinc-100 transition-all active:scale-[0.98]"
            >
              Get Started for Free
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/login"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 px-8 py-4 text-sm font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all active:scale-[0.98]"
            >
              Sign In to Existing Store
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}