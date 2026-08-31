import Link from "next/link"
import {
  ArrowRight,
  Check,
  CircleAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react"

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#F1F0F8] pt-28 sm:pt-32">
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute -left-48 top-40 h-[520px] w-[520px] rounded-full bg-[#C8ACD6]/60 blur-3xl" />

      <div className="pointer-events-none absolute -right-40 top-16 h-[600px] w-[600px] rounded-full bg-[#C8ACD6]/45 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-10 pb-14 sm:pb-16 lg:grid-cols-[0.86fr_1.14fr] lg:gap-10 lg:pb-20">
          
          {/* Copy */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#433D8B]/15 bg-[#FFFFFF]/55 px-3.5 py-2">
              <Sparkles className="h-3.5 w-3.5 text-[#433D8B]" />

              <span className="text-xs font-medium text-[#433D8B]">
                Business intelligence, connected
              </span>
            </div>

            <h1 className="mt-7 text-[54px] font-semibold leading-[0.96] tracking-[-0.055em] text-[#17153B] sm:text-[64px] lg:text-[64px]">
              Understand.
              <span className="block text-[#433D8B]">Decide.</span>
              <span className="block">Grow.</span>
            </h1>

            <p className="mt-7 max-w-lg text-[15px] leading-7 text-[#433D8B] sm:text-base">
              Nexora brings your business data together, reveals what is
              changing, explains why it matters, and helps you decide what to
              do next.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#17153B] px-5 py-3.5 text-sm font-medium text-[#F1F0F8] shadow-[0_10px_30px_rgba(45,35,46,0.12)] transition hover:bg-[#2E236C]"
              >
                Start with your business

                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <a
                href="#product"
                className="inline-flex items-center justify-center rounded-xl border border-[#433D8B]/20 bg-[#FFFFFF]/40 px-5 py-3.5 text-sm font-medium text-[#2E236C] transition hover:bg-[#FFFFFF]/70"
              >
                See how it works
              </a>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
              {[
                "One connected view",
                "Explain the why",
                "Decide with confidence",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-1.5 text-xs text-[#433D8B]"
                >
                  <Check className="h-3.5 w-3.5 text-[#2E236C]" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Product */}
          <HeroProductPreview />
        </div>
      </div>
    </section>
  )
}

function HeroProductPreview() {
  return (
    <div className="relative lg:translate-y-1 lg:scale-[0.96]">
      <div className="pointer-events-none absolute -inset-6 rounded-[40px] bg-[#C8ACD6]/45 blur-3xl" />

      <div className="relative rounded-[26px] border border-[#433D8B]/15 bg-[#FFFFFF] p-2 shadow-[0_30px_80px_rgba(45,35,46,0.13)]">
        <div className="overflow-hidden rounded-[20px] border border-[#433D8B]/10">
          
          {/* App bar */}
          <div className="flex h-11 items-center justify-between border-b border-[#433D8B]/10 px-5">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#433D8B]" />

              <span className="text-[11px] font-medium text-[#2E236C]">
                Overview
              </span>
            </div>

            <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-[#433D8B]/50">
              NEXORA
            </span>
          </div>

          <div className="bg-[#F1F0F8]/40 p-5 sm:p-6">
            
            {/* Greeting */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[9px] uppercase tracking-[0.16em] text-[#433D8B]/50">
                  Business overview
                </p>

                <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.025em] text-[#17153B]">
                  Good morning.
                </h2>
              </div>

              <div className="rounded-lg border border-[#433D8B]/10 bg-[#FFFFFF] px-3 py-2">
                <span className="text-[9px] text-[#433D8B]">
                  Last 30 days
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div className="mt-5 grid grid-cols-3 gap-2.5">
              <Metric
                label="Revenue"
                value="₹24.8L"
                change="+12.4%"
              />

              <Metric
                label="Orders"
                value="1,284"
                change="+8.7%"
              />

              <Metric
                label="Margin"
                value="31.8%"
                change="+2.1%"
              />
            </div>

            {/* Main intelligence area */}
            <div className="mt-2.5 grid gap-2.5 md:grid-cols-[1.08fr_0.92fr]">
              
              {/* Chart */}
              <div className="rounded-xl border border-[#433D8B]/10 bg-[#FFFFFF] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#17153B]">
                      Revenue
                    </p>

                    <p className="mt-0.5 text-[9px] text-[#433D8B]/50">
                      Performance over time
                    </p>
                  </div>

                  <TrendingUp className="h-4 w-4 text-[#433D8B]" />
                </div>

                <div className="relative mt-5 h-24">
                  <div className="absolute inset-x-0 top-0 border-t border-dashed border-[#433D8B]/10" />
                  <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-[#433D8B]/10" />
                  <div className="absolute inset-x-0 bottom-0 border-t border-dashed border-[#433D8B]/10" />

                  <div className="absolute inset-x-1 bottom-0 flex h-full items-end gap-1">
                    {[35, 43, 40, 55, 50, 63, 59, 72, 68, 82, 77, 94].map(
                      (height, index) => (
                        <div
                          key={index}
                          className="flex-1 rounded-t-sm bg-[#433D8B]/20"
                          style={{ height: `${height}%` }}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Insight */}
              <div className="rounded-xl bg-[#17153B] p-4 text-[#F1F0F8]">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-[#C8ACD6]" />

                  <span className="text-[10px] font-medium text-[#C8ACD6]">
                    Nexora noticed
                  </span>
                </div>

                <p className="mt-4 text-[13px] font-medium leading-5">
                  Revenue is growing, but supplier delays are increasing.
                </p>

                <p className="mt-2 text-[10px] leading-4 text-[#C8ACD6]/65">
                  Two high-value products may be affected next week.
                </p>

                <button className="mt-4 flex items-center gap-1 text-[10px] font-medium text-[#C8ACD6]">
                  Investigate
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Bottom insight */}
            <div className="mt-2.5 flex items-start gap-3 rounded-xl border border-[#433D8B]/10 bg-[#FFFFFF] p-4">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#433D8B]" />

              <div>
                <p className="text-[11px] font-semibold text-[#17153B]">
                  One thing worth watching
                </p>

                <p className="mt-1 text-[10px] leading-4 text-[#433D8B]/65">
                  Supplier lead time increased by 2.4 days this week.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  change,
}: {
  label: string
  value: string
  change: string
}) {
  return (
    <div className="rounded-xl border border-[#433D8B]/10 bg-[#FFFFFF] p-3.5">
      <p className="text-[9px] text-[#433D8B]/55">
        {label}
      </p>

      <p className="mt-1.5 text-lg font-semibold tracking-[-0.02em] text-[#17153B]">
        {value}
      </p>

      <p className="mt-1 text-[9px] font-medium text-[#2E236C]">
        {change}
      </p>
    </div>
  )
}