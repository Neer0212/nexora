"use client"

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
  },
  {
    id: "inventory",
    label: "Inventory",
    title: "Know what you have.",
    description:
      "Understand stock levels, availability, movement, and the products that need attention.",
    icon: Package,
  },
  {
    id: "suppliers",
    label: "Suppliers",
    title: "Know who you depend on.",
    description:
      "See supplier reliability, lead times, costs, and the relationships affecting your operations.",
    icon: Truck,
  },
  {
    id: "customers",
    label: "Customers",
    title: "Know who drives demand.",
    description:
      "Understand customer activity, purchasing patterns, account value, and changing demand.",
    icon: Users,
  },
  {
    id: "finance",
    label: "Finance",
    title: "Know where money moves.",
    description:
      "Connect revenue, costs, margins, payments, and cash signals to the rest of the business.",
    icon: CircleDollarSign,
  },
  {
    id: "operations",
    label: "Operations",
    title: "Know what's happening underneath.",
    description:
      "Bring operational signals together so bottlenecks don't stay hidden inside individual systems.",
    icon: Factory,
  },
]

export default function BusinessTypes() {
  return (
    <section
      id="business-types"
      className="relative overflow-hidden bg-white py-24 sm:py-32 border-t border-zinc-200"
    >
      <div className="mx-auto max-w-7xl px-6">
        {/* Intro */}
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold text-blue-600">
              One business. Many signals.
            </p>

            <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-zinc-950 sm:text-5xl">
              Everything is connected.
            </h2>
          </div>

          <div className="max-w-xl">
            <p className="text-lg leading-8 text-zinc-600">
              Nexora connects the parts of your business that are usually
              looked at separately. Because a change in sales can affect inventory. Inventory can
              depend on suppliers. Suppliers can affect margins. And all of it
              ultimately affects your customers.
            </p>
          </div>
        </div>

        {/* Connected business map */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => {
            const Icon = area.icon

            return (
              <div
                key={area.id}
                className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 sm:p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-zinc-200 shadow-sm">
                    <Icon className="h-5 w-5 text-zinc-700" />
                  </div>
                  <span className="text-sm font-semibold text-zinc-950">
                    {area.label}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-zinc-950">
                  {area.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  {area.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Closing statement */}
        <div className="mt-20 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-zinc-200 pt-10">
          <p className="text-lg font-medium text-zinc-950">
            Your business doesn't operate in departments. <span className="text-zinc-500">Neither should your intelligence.</span>
          </p>

          <a
            href="#final-cta"
            className="group inline-flex items-center gap-2 text-sm font-medium text-zinc-950 hover:text-blue-600 transition-colors"
          >
            See what Nexora can do
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  )
}