"use client"

import { motion, useReducedMotion } from "motion/react"
import {
  Boxes,
  CircleDollarSign,
  FileSpreadsheet,
  Package,
  ShoppingCart,
  Users,
  ArrowRight,
  Database,
} from "lucide-react"
import Link from "next/link"

const sources = [
  {
    name: "Orders & Sales",
    description: "Multi-channel orders, real-time POS receipts, and transactions.",
    icon: ShoppingCart,
    color: "text-blue-600 bg-blue-50 border-blue-200/60",
  },
  {
    name: "Live Inventory",
    description: "Continuous stock count, warehouse valuation, and restock alerts.",
    icon: Package,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200/60",
  },
  {
    name: "Suppliers & Purchases",
    description: "Purchase orders, delivery lead times, and reliability scoring.",
    icon: Boxes,
    color: "text-indigo-600 bg-indigo-50 border-indigo-200/60",
  },
  {
    name: "Customer Accounts",
    description: "Profiles, purchase frequency, average order values, and loyalty.",
    icon: Users,
    color: "text-purple-600 bg-purple-50 border-purple-200/60",
  },
  {
    name: "Finance & Margin",
    description: "Real net sales, refund mirror tracking, expenses, and gross profits.",
    icon: CircleDollarSign,
    color: "text-amber-600 bg-amber-50 border-amber-200/60",
  },
  {
    name: "Spreadsheet Bridge",
    description: "Import legacy CSV, XLSX, and enterprise ERP records seamlessly.",
    icon: FileSpreadsheet,
    color: "text-cyan-600 bg-cyan-50 border-cyan-200/60",
  },
]

export default function IntelligenceSection() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section
      id="product"
      className="relative overflow-hidden bg-white py-24 sm:py-32 border-t border-zinc-200/80"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Intro */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3.5 py-1 text-xs font-semibold text-zinc-800"
          >
            <Database className="h-3.5 w-3.5 text-blue-600" />
            Connected Data Architecture
          </motion.div>

          <motion.h2
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-5xl"
          >
            One unified platform.{" "}
            <span className="text-zinc-400 block sm:inline">Zero data silos.</span>
          </motion.h2>

          <motion.p
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 text-base sm:text-lg leading-relaxed text-zinc-600"
          >
            Stop stitching disjointed spreadsheets and isolated POS portals. Nexora binds your operational reality into a unified intelligence graph.
          </motion.p>
        </div>

        {/* 6 Grid Cards */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sources.map((item, idx) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.name}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="group relative rounded-3xl border border-zinc-200/80 bg-zinc-50/50 p-7 transition-all duration-300 hover:border-blue-300 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${item.color} shadow-sm transition-transform group-hover:scale-105`}>
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="mt-5 text-lg font-bold tracking-tight text-zinc-950 group-hover:text-blue-600 transition-colors">
                  {item.name}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {item.description}
                </p>

                <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
                  <span>Explore stream</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}