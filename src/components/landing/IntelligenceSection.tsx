import {
  ArrowDown,
  ArrowRight,
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
      className="relative overflow-hidden bg-[#F1F0F8] py-16 sm:py-20"
    >
      {/* Subtle divider */}
      <div className="mx-auto max-w-7xl px-6">
        <div className="h-px w-full bg-[#433D8B]/10" />

        {/* Intro */}
        <div className="mx-auto max-w-3xl pt-20 text-center sm:pt-24">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#433D8B]/60">
            The problem
          </p>

          <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-[#17153B] sm:text-5xl lg:text-6xl">
            Your business has the data.
            <span className="block text-[#433D8B]">
              The problem is understanding it.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#433D8B] sm:text-lg">
            Sales lives in one place. Inventory somewhere else. Suppliers,
            customers, payments and operations tell different parts of the
            story.
          </p>
        </div>

        {/* Data sources */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {sources.map((source) => {
              const Icon = source.icon

              return (
                <div
                  key={source.name}
                  className="group rounded-2xl border border-[#433D8B]/12 bg-[#FFFFFF]/55 p-4 transition duration-300 hover:-translate-y-1 hover:bg-[#FFFFFF] hover:shadow-[0_14px_35px_rgba(45,35,46,0.07)]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C8ACD6]/70 text-[#2E236C]">
                    <Icon className="h-4 w-4" />
                  </div>

                  <p className="mt-4 text-sm font-medium text-[#17153B]">
                    {source.name}
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-[#433D8B]/60">
                    {source.description}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Connector */}
          <div className="flex justify-center py-7">
            <div className="flex flex-col items-center">
              <div className="h-8 w-px bg-[#433D8B]/20" />

              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#433D8B]/15 bg-[#C8ACD6]/50">
                <ArrowDown className="h-3.5 w-3.5 text-[#433D8B]" />
              </div>

              <div className="h-8 w-px bg-[#433D8B]/20" />
            </div>
          </div>

          {/* Nexora */}
          <div className="mx-auto max-w-2xl rounded-[28px] border border-[#17153B] bg-[#17153B] p-2 shadow-[0_25px_70px_rgba(45,35,46,0.16)]">
            <div className="rounded-[21px] border border-[#F1F0F8]/10 px-6 py-8 text-center sm:px-10 sm:py-10">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C8ACD6]">
                <BarChart3 className="h-5 w-5 text-[#17153B]" />
              </div>

              <p className="mt-5 text-[10px] font-medium uppercase tracking-[0.2em] text-[#C8ACD6]/60">
                One connected view
              </p>

              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#F1F0F8] sm:text-3xl">
                Nexora
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#C8ACD6]/70">
                Connect the pieces of your business and turn scattered
                information into a picture you can actually understand.
              </p>

              <div className="mt-7 flex flex-wrap justify-center gap-2">
                {[
                  "Understand",
                  "Explain",
                  "Predict",
                  "Decide",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[#F1F0F8]/10 bg-[#F1F0F8]/5 px-3 py-1.5 text-[10px] text-[#C8ACD6]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom statement */}
        <div className="mx-auto mt-20 grid max-w-5xl items-center gap-8 border-t border-[#433D8B]/10 pt-10 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="text-lg font-medium tracking-tight text-[#17153B]">
              Stop switching between systems to understand one business.
            </p>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#433D8B]/70">
              Nexora gives every part of your business a shared context.
            </p>
          </div>

          <a
            href="#intelligence"
            className="group inline-flex items-center gap-2 text-sm font-medium text-[#2E236C]"
          >
            See the intelligence
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  )
}