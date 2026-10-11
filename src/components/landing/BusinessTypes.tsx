"use client"

import { motion, useReducedMotion } from "motion/react"
import {
  CircleDollarSign,
  Factory,
  Package,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react"

const areas = [
  {
    id: "sales",
    label: "POS & Sales Operations",
    title: "Real-time checkout, receipts, returns",
    description:
      "Full counter POS with barcode scanning, custom discounts, walk-in customer history, and refund parity.",
    icon: ShoppingCart,
  },
  {
    id: "inventory",
    label: "Stock & Warehouse",
    title: "Precision valuation & stockouts",
    description:
      "Live quantity tracking, multi-warehouse support, automated reorder triggers, and dead-stock identification.",
    icon: Package,
  },
  {
    id: "suppliers",
    label: "Vendor Intelligence",
    title: "Lead time & dependency scoring",
    description:
      "Monitor delivery lag, reliability ratings, and cost variances across every active supplier relationship.",
    icon: Truck,
  },
  {
    id: "customers",
    label: "Customer Relationships",
    title: "Purchasing behavior & churn",
    description:
      "Identify high-value wholesale accounts, repeat store customers, and track individual lifetime value.",
    icon: Users,
  },
  {
    id: "finance",
    label: "Executive Finance",
    title: "Net sales & expense tracking",
    description:
      "True financial ledger reflecting returns, category expenses, and payment reconciliation without approximations.",
    icon: CircleDollarSign,
  },
  {
    id: "brain",
    label: "Autonomous Strategy",
    title: "Targets, forecasting & AI assistant",
    description:
      "Set quarterly performance goals, project period cashflows, and ask questions directly to your store dataset.",
    icon: Factory,
  },
]

export default function BusinessTypes() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section className="relative overflow-hidden bg-white py-24 sm:py-32 border-t border-zinc-200/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h2
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-5xl"
          >
            Built for modern businesses of every shape.
          </motion.h2>

          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-base sm:text-lg leading-relaxed text-zinc-600"
          >
            Whether running retail storefronts, wholesale distribution, or direct-to-consumer operations, Nexora connects every moving part.
          </motion.p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area, idx) => {
            const Icon = area.icon
            return (
              <motion.div
                key={area.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="group rounded-3xl border border-zinc-200/80 bg-zinc-50/50 p-7 transition-all duration-300 hover:border-zinc-300 hover:bg-white hover:shadow-lg hover:-translate-y-1"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white border border-zinc-200/80 text-zinc-950 shadow-sm group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-5">
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    {area.label}
                  </span>
                  <h3 className="mt-1 text-lg font-bold text-zinc-950">
                    {area.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    {area.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}