import {
  ArrowDown,
  BarChart3,
  Boxes,
  CircleDollarSign,
  FileSpreadsheet,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react"

const sources = [
  {
    name: "Sales",
    description: "Orders & revenue",
    icon: ShoppingCart,
  },
  {
    name: "Inventory",
    description: "Stock & availability",
    icon: Package,
  },
  {
    name: "Suppliers",
    description: "Costs & reliability",
    icon: Boxes,
  },
  {
    name: "Customers",
    description: "Accounts & demand",
    icon: Users,
  },
  {
    name: "Finance",
    description: "Payments & margins",
    icon: CircleDollarSign,
  },
  {
    name: "Spreadsheets",
    description: "Your existing data",
    icon: FileSpreadsheet,
  },
]

export default function IntelligenceSection() {
  return (
    <section
      id="product"
      className="relative overflow-hidden bg-white py-24 sm:py-32 border-t border-zinc-200"
    >
      <div className="mx-auto max-w-7xl px-6">
        {/* Intro */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold text-blue-600">
            The problem
          </p>

          <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-zinc-950 sm:text-5xl">
            Your business has the data.
            <span className="block text-zinc-500">
              The problem is understanding it.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
            Sales lives in one place. Inventory somewhere else. Suppliers,
            customers, payments and operations tell different parts of the
            story.
          </p>
        </div>

        {/* Data sources */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {sources.map((source) => {
              const Icon = source.icon

              return (
                <div
                  key={source.name}
                  className="group rounded-xl border border-zinc-200 bg-zinc-50 p-5 transition hover:border-zinc-300"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-zinc-200 text-zinc-700 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>

                  <p className="mt-4 text-sm font-semibold text-zinc-950">
                    {source.name}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    {source.description}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Connector */}
          <div className="flex justify-center py-8">
            <div className="flex flex-col items-center">
              <div className="h-10 w-px bg-zinc-200" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white">
                <ArrowDown className="h-4 w-4 text-zinc-400" />
              </div>
              <div className="h-10 w-px bg-zinc-200" />
            </div>
          </div>

          {/* Nexora */}
          <div className="mx-auto max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 sm:p-12 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-6">
              <BarChart3 className="h-6 w-6" />
            </div>

            <p className="text-xs font-semibold text-blue-600">
              One connected view
            </p>

            <h3 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
              Nexora
            </h3>

            <p className="mx-auto mt-4 max-w-md text-base leading-7 text-zinc-600">
              Connect the pieces of your business and turn scattered
              information into a picture you can actually understand.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}