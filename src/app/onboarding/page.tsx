"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle, ChevronDown } from "lucide-react"

import { createClient } from "@/lib/supabase/client"

export default function OnboardingPage() {
    const router = useRouter()
    const supabase = createClient()

    const [businessName, setBusinessName] = useState("")
    const [industry, setIndustry] = useState("")
    const [businessType, setBusinessType] = useState("")
    const [currency, setCurrency] = useState("USD")

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        async function checkUser() {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                router.replace("/login")
                return
            }

            setLoading(false)
        }

        checkUser()
    }, [router, supabase])


    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        setError("")

        if (!businessName.trim()) {
            setError("Please enter your business name.")
            return
        }

        setSubmitting(true)

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            router.replace("/login")
            return
        }

        const { error: businessError } = await supabase.rpc("create_business", {
            p_name: businessName.trim(),
            p_business_type: businessType || null,
            p_industry: industry.trim() || null,
        })

        if (businessError) {
            setError(
                businessError.message ||
                "We couldn't create your business. Please try again."
            )
            setSubmitting(false)
            return
        }

        // Optional: Save currency somewhere if needed, currently create_business doesn't support currency param.
        
        router.push("/dashboard")
        router.refresh()
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#F1F0F8]">
                <Loader2 className="h-8 w-8 animate-spin text-[#433D8B]" />
            </main>
        )
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#F1F0F8] px-6 py-12">
            <div className="w-full max-w-xl">
                <div className="mb-8">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-[#433D8B] uppercase">
                        NEXORA
                    </p>

                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#17153B]">
                        Tell us about your business
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-[#68647A]">
                        We need this to set up your workspace and format your metrics correctly. You can change these details later.
                    </p>
                </div>

                <div className="rounded-3xl border border-[#E7E4EF] bg-[#FFFFFF] p-6 shadow-[0_12px_35px_rgba(23,21,59,0.04)] sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                htmlFor="business-name"
                                className="mb-2 block text-sm font-medium text-[#17153B]"
                            >
                                Business name
                            </label>

                            <input
                                id="business-name"
                                type="text"
                                required
                                value={businessName}
                                onChange={(event) => setBusinessName(event.target.value)}
                                placeholder="e.g. Acme Manufacturing"
                                className="w-full rounded-xl border border-[#E7E4EF] px-4 py-3 text-sm text-[#17153B] outline-none transition focus:border-[#433D8B] focus:ring-2 focus:ring-[#C8ACD6]/30 placeholder:text-[#68647A]/60"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="business-type"
                                    className="mb-2 block text-sm font-medium text-[#17153B]"
                                >
                                    Business type
                                </label>

                                <div className="relative">
                                    <select
                                        id="business-type"
                                        value={businessType}
                                        onChange={(event) => setBusinessType(event.target.value)}
                                        className="w-full appearance-none rounded-xl border border-[#E7E4EF] bg-[#FFFFFF] px-4 py-3 pr-10 text-sm text-[#17153B] outline-none transition focus:border-[#433D8B] focus:ring-2 focus:ring-[#C8ACD6]/30"
                                    >
                                        <option value="">Select a type</option>
                                        <option value="Manufacturing">Manufacturing</option>
                                        <option value="Trading">Trading</option>
                                        <option value="Services">Services</option>
                                        <option value="Construction">Construction</option>
                                        <option value="Retail">Retail</option>
                                        <option value="Technology">Technology</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#68647A]" />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="currency"
                                    className="mb-2 block text-sm font-medium text-[#17153B]"
                                >
                                    Primary currency
                                </label>

                                <div className="relative">
                                    <select
                                        id="currency"
                                        value={currency}
                                        onChange={(event) => setCurrency(event.target.value)}
                                        className="w-full appearance-none rounded-xl border border-[#E7E4EF] bg-[#FFFFFF] px-4 py-3 pr-10 text-sm text-[#17153B] outline-none transition focus:border-[#433D8B] focus:ring-2 focus:ring-[#C8ACD6]/30"
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                        <option value="CAD">CAD ($)</option>
                                        <option value="AUD">AUD ($)</option>
                                        <option value="INR">INR (₹)</option>
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#68647A]" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="industry"
                                className="mb-2 block text-sm font-medium text-[#17153B]"
                            >
                                Industry
                            </label>

                            <input
                                id="industry"
                                type="text"
                                value={industry}
                                onChange={(event) => setIndustry(event.target.value)}
                                placeholder="e.g. Industrial manufacturing"
                                className="w-full rounded-xl border border-[#E7E4EF] px-4 py-3 text-sm text-[#17153B] outline-none transition focus:border-[#433D8B] focus:ring-2 focus:ring-[#C8ACD6]/30 placeholder:text-[#68647A]/60"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 rounded-xl border border-[#B85454]/20 bg-[#B85454]/5 px-4 py-3 text-sm text-[#B85454]">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-[#17153B] px-4 py-3 text-sm font-medium text-[#FFFFFF] transition hover:bg-[#2E236C] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Setting up workspace...</span>
                                </>
                            ) : (
                                "Create workspace"
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-6 text-center text-xs text-[#68647A]">
                    You can update your business information later in Settings.
                </p>
            </div>
        </main>
    )
}