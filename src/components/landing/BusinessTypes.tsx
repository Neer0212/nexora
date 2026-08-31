"use client"

import { useState } from "react"
import {
  ArrowRight,
  Boxes,
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
    label: "Sales",
    title: "Know what's selling.",
    description:
      "Track revenue, orders, products, regions, and customer demand in one connected view.",
    icon: ShoppingCart,
    metrics: [
      ["Revenue", "₹24.8L"],
      ["Orders", "1,284"],
      ["Growth", "+12.4%"],
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    title: "Know what you have.",
    description:
      "Understand stock levels, availability, movement, and the products that need attention.",
    icon: Package,
    metrics: [
      ["Inventory", "₹8.6L"],
      ["Low stock", "12"],
      ["Turnover", "4.8×"],
    ],
  },
  {
    id: "suppliers",
    label: "Suppliers",
    title: "Know who you depend on.",
    description:
      "See supplier reliability, lead times, costs, and the relationships affecting your operations.",
    icon: Truck,
    metrics: [
      ["Suppliers", "24"],
      ["Lead time", "6.4d"],
      ["Reliability", "91%"],
    ],
  },
  {
    id: "customers",
    label: "Customers",
    title: "Know who drives demand.",
    description:
      "Understand customer activity, purchasing patterns, account value, and changing demand.",
    icon: Users,
    metrics: [
      ["Customers", "842"],
      ["Repeat rate", "68%"],
      ["Avg. order", "₹4.2K"],
    ],
  },
  {
    id: "finance",
    label: "Finance",
    title: "Know where money moves.",
    description:
      "Connect revenue, costs, margins, payments, and cash signals to the rest of the business.",
    icon: CircleDollarSign,
    metrics: [
      ["Gross margin", "31.8%"],
      ["Receivables", "₹6.2L"],
      ["Cash flow", "+8.1%"],
    ],
  },
  {
    id: "operations",
    label: "Operations",
    title: "Know what's happening underneath.",
    description:
      "Bring operational signals together so bottlenecks don't stay hidden inside individual systems.",
    icon: Factory,
    metrics: [
      ["Efficiency", "87%"],
      ["Open issues", "18"],
      ["On time", "94%"],
    ],
  },
]

export default function BusinessTypes() {
  const [activeId, setActiveId] = useState("sales")

  const active =
    areas.find((area) => area.id === activeId) ?? areas[0]

  const ActiveIcon = active.icon

  return (
    <section
      id="business-types"
      className="relative overflow-hidden bg-[#F1F0F8] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-6">
        {/* Intro */}
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#433D8B]/55">
              One business. Many signals.
            </p>

            <h2 className="mt-5 text-4xl font-semibold leading-[1.04] tracking-[-0.045em] text-[#17153B] sm:text-5xl lg:text-6xl">
              Everything is
              <span className="block text-[#433D8B]">
                connected.
              </span>
            </h2>
          </div>

          <div className="max-w-xl">
            <p className="text-base leading-7 text-[#433D8B] sm:text-lg">
              Nexora connects the parts of your business that are usually
              looked at separately.
            </p>

            <p className="mt-3 text-sm leading-6 text-[#433D8B]/65">
              Because a change in sales can affect inventory. Inventory can
              depend on suppliers. Suppliers can affect margins. And all of it
              ultimately affects your customers.
            </p>
          </div>
        </div>

        {/* Connected business map */}
        <div className="relative mt-10 overflow-hidden rounded-[30px] border border-[#433D8B]/15 bg-[#FFFFFF] shadow-[0_25px_70px_rgba(45,35,46,0.09)] sm:mt-12">
          {/* Top bar */}
          <div className="flex items-center justify-between border-b border-[#433D8B]/10 px-5 py-4 sm:px-7">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C8ACD6]/65">
                <Boxes className="h-4 w-4 text-[#2E236C]" />
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-[0.16em] text-[#433D8B]/45">
                  Connected business
                </p>

                <p className="mt-0.5 text-xs font-medium text-[#17153B]">
                  Your business at a glance
                </p>
              </div>
            </div>

            <span className="hidden text-[9px] uppercase tracking-[0.16em] text-[#433D8B]/35 sm:block">
              Live context
            </span>
          </div>

          <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
            {/* Navigation */}
            <div className="border-b border-[#433D8B]/10 bg-[#F1F0F8]/35 p-4 sm:p-6 lg:border-b-0 lg:border-r">
              <p className="mb-3 px-2 text-[9px] uppercase tracking-[0.16em] text-[#433D8B]/40">
                Business areas
              </p>

              <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-1">
                {areas.map((area) => {
                  const Icon = area.icon
                  const isActive = area.id === activeId

                  return (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => setActiveId(area.id)}
                      className={[
                        "group flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200",
                        isActive
                          ? "bg-[#17153B] text-[#F1F0F8] shadow-sm"
                          : "text-[#433D8B] hover:bg-[#C8ACD6]/75 hover:text-[#17153B]",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
                          isActive
                            ? "bg-[#F1F0F8]/10 text-[#C8ACD6]"
                            : "bg-[#C8ACD6]/55 text-[#433D8B] group-hover:bg-[#F1F0F8] group-hover:text-[#17153B]",
                        ].join(" ")}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>

                      <span className="text-xs font-medium">
                        {area.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Active area */}
            <div className="p-5 sm:p-7">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C8ACD6]/60">
                      <ActiveIcon className="h-4 w-4 text-[#2E236C]" />
                    </div>

                    <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-[#433D8B]/45">
                      {active.label}
                    </span>
                  </div>

                  <h3 className="mt-5 text-2xl font-semibold tracking-[-0.035em] text-[#17153B] sm:text-3xl">
                    {active.title}
                  </h3>

                  <p className="mt-3 max-w-xl text-sm leading-6 text-[#433D8B]/65">
                    {active.description}
                  </p>
                </div>

                <div className="hidden h-10 w-10 items-center justify-center rounded-full border border-[#433D8B]/10 sm:flex">
                  <ArrowRight className="h-4 w-4 text-[#433D8B]" />
                </div>
              </div>

              {/* Metrics */}
              <div className="mt-7 grid grid-cols-3 gap-2">
                {active.metrics.map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-[#433D8B]/10 bg-[#F1F0F8]/45 p-4"
                  >
                    <p className="text-[9px] text-[#433D8B]/50">
                      {label}
                    </p>

                    <p className="mt-2 text-base font-semibold tracking-[-0.02em] text-[#17153B] sm:text-lg">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Connection visualization */}
              <div className="relative mt-3 overflow-hidden rounded-2xl border border-[#433D8B]/10 bg-[#F1F0F8]/35 p-5">
                <p className="text-[9px] uppercase tracking-[0.16em] text-[#433D8B]/40">
                  Connected context
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {areas.slice(0, 5).map((area, index) => {
                    const Icon = area.icon

                    return (
                      <div
                        key={area.id}
                        className="flex items-center gap-2"
                      >
                        <div
                          className={[
                            "flex items-center gap-2 rounded-lg border px-2.5 py-2",
                            area.id === active.id
                              ? "border-[#433D8B]/20 bg-[#FFFFFF]"
                              : "border-[#433D8B]/10 bg-[#FFFFFF]/45",
                          ].join(" ")}
                        >
                          <Icon className="h-3 w-3 text-[#433D8B]" />

                          <span className="text-[9px] text-[#2E236C]">
                            {area.label}
                          </span>
                        </div>

                        {index < 4 && (
                          <div className="h-px w-3 bg-[#433D8B]/15" />
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="mt-5 flex items-center gap-2 text-[9px] text-[#433D8B]/50">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#433D8B]/50" />

                  Nexora uses these signals together to build context.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Closing statement */}
        <div className="mt-10 grid gap-5 border-t border-[#433D8B]/10 pt-7 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-lg font-medium tracking-tight text-[#17153B]">
              Your business doesn&apos;t operate in departments.
            </p>

            <p className="mt-1 text-lg font-medium tracking-tight text-[#433D8B]">
              Neither should your intelligence.
            </p>
          </div>

          <a
            href="#final-cta"
            className="group inline-flex items-center gap-2 text-sm font-medium text-[#2E236C]"
          >
            See what Nexora can do

            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  )
}