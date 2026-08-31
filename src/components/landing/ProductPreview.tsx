import {
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    CircleAlert,
    Sparkles,
} from "lucide-react"

export default function ProductPreview() {
    return (
        <section
            id="product"
            className="mx-auto max-w-7xl px-6 pt-20"
        >
            <div className="relative overflow-hidden rounded-[28px] border border-[#E7E4EF] bg-[#F1F0F8] p-2 shadow-2xl shadow-[#17153B]/10">
                <div className="rounded-[22px] border border-[#E7E4EF] bg-[#FFFFFF]">
                    <div className="flex h-12 items-center justify-between border-b border-[#E7E4EF] px-5">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-[#D9D5E4]" />
                            <span className="text-xs font-medium text-[#68647A]">
                                Business Overview
                            </span>
                        </div>

                        <span className="text-[10px] font-medium uppercase tracking-wider text-[#9A94A8]">
                            Nexora
                        </span>
                    </div>

                    <div className="grid lg:grid-cols-[190px_1fr]">
                        <aside className="hidden border-r border-[#E7E4EF] p-4 lg:block">
                            <div className="mb-5 flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#12102F]">
                                    <span className="text-[10px] font-semibold text-[#FFFFFF]">
                                        N
                                    </span>
                                </div>

                                <span className="text-xs font-semibold text-[#17153B]">
                                    nexora
                                </span>
                            </div>

                            <div className="space-y-1">
                                {[
                                    "Overview",
                                    "Business Brain",
                                    "Analytics",
                                    "Autopsy",
                                    "Inventory",
                                    "Suppliers",
                                ].map((item, index) => (
                                    <div
                                        key={item}
                                        className={[
                                            "rounded-md px-2.5 py-2 text-[10px]",
                                            index === 0
                                                ? "bg-[#F0EEF6] font-medium text-[#17153B]"
                                                : "text-[#9A94A8]",
                                        ].join(" ")}
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </aside>

                        <div className="p-5 sm:p-7">
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-[#9A94A8]">
                                        BUSINESS OVERVIEWs
                                    </p>

                                    <h3 className="mt-1 text-xl font-semibold tracking-tight text-[#12102F]">
                                        Good morning.
                                    </h3>
                                </div>

                                <div className="hidden items-center gap-1.5 rounded-md border border-[#E7E4EF] px-2.5 py-1.5 sm:flex">
                                    <span className="text-[10px] text-[#68647A]">
                                        Last 30 days
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                {(
                                    [
                                        ["Revenue", "₹24.8L", "+12.4%", true],
                                        ["Gross margin", "31.8%", "+2.1%", true],
                                        ["Orders", "1,284", "+8.7%", true],
                                        ["Inventory", "₹8.6L", "-4.2%", false],
                                    ] as const
                                ).map(([label, value, change, positive]) => (
                                    <div
                                        key={label}
                                        className="rounded-xl border border-[#E7E4EF] p-4"
                                    >
                                        <p className="text-[10px] text-[#9A94A8]">
                                            {label}
                                        </p>

                                        <p className="mt-2 text-lg font-semibold tracking-tight text-[#12102F]">
                                            {value}
                                        </p>

                                        <div className="mt-2 flex items-center gap-1">
                                            {positive ? (
                                                <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                                            ) : (
                                                <ArrowDownRight className="h-3 w-3 text-amber-600" />
                                            )}

                                            <span className="text-[10px] font-medium text-[#68647A]">
                                                {change}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-3 grid gap-3 lg:grid-cols-[1.45fr_0.8fr]">
                                <div className="rounded-xl border border-[#E7E4EF] p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-[#17153B]">
                                                Revenue trend
                                            </p>
                                            <p className="mt-0.5 text-[10px] text-[#9A94A8]">
                                                Compared with previous period
                                            </p>
                                        </div>

                                        <BarChart3 className="h-4 w-4 text-[#D9D5E4]" />
                                    </div>

                                    <div className="mt-5 flex h-32 items-end gap-1.5">
                                        {[42, 55, 48, 67, 61, 76, 71, 83, 74, 91, 86, 98].map(
                                            (height, index) => (
                                                <div
                                                    key={index}
                                                    className="flex-1 rounded-t-sm bg-[#E7E4EF]"
                                                    style={{ height: `${height}%` }}
                                                />
                                            )
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-[#E7E4EF] p-4">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 text-blue-600" />

                                        <p className="text-xs font-medium text-[#17153B]">
                                            Nexora noticed
                                        </p>
                                    </div>

                                    <p className="mt-4 text-sm font-medium leading-5 text-[#17153B]">
                                        Inventory exposure has fallen 4.2% while revenue is
                                        growing.
                                    </p>

                                    <p className="mt-2 text-[10px] leading-4 text-[#9A94A8]">
                                        Driven primarily by faster movement in three high-value
                                        products.
                                    </p>

                                    <div className="mt-4 flex items-center gap-1.5 text-[10px] font-medium text-blue-600">
                                        Investigate
                                        <ArrowRight className="h-3 w-3" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 rounded-xl border border-[#E7E4EF] bg-[#F1F0F8] p-4">
                                <div className="flex items-start gap-3">
                                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />

                                    <div>
                                        <p className="text-xs font-medium text-[#17153B]">
                                            One thing worth watching
                                        </p>

                                        <p className="mt-1 text-[10px] leading-4 text-[#68647A]">
                                            Supplier lead time increased by 2.4 days this week,
                                            affecting two products with low remaining stock.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function ArrowRight({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M3 8H13M9 4L13 8L9 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}