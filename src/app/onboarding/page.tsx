"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"

export default function OnboardingPage() {
    const router = useRouter()
    const supabase = createClient()

    const [businessName, setBusinessName] = useState("")
    const [industry, setIndustry] = useState("")
    const [businessType, setBusinessType] = useState("")

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

        router.push("/dashboard")
        router.refresh()
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50">
                <p className="text-sm text-slate-500">Loading...</p>
            </main>
        )
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
            <div className="w-full max-w-xl">
                <div className="mb-8">
                    <p className="text-sm font-semibold tracking-wide text-blue-600">
                        NEXORA
                    </p>

                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                        Tell us about your business
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        This helps us set up your Nexora workspace. You can change these
                        details later.
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                htmlFor="business-name"
                                className="mb-2 block text-sm font-medium text-slate-700"
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
                                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="business-type"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Business type
                            </label>

                            <select
                                id="business-type"
                                value={businessType}
                                onChange={(event) => setBusinessType(event.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                        </div>

                        <div>
                            <label
                                htmlFor="industry"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Industry
                            </label>

                            <input
                                id="industry"
                                type="text"
                                value={industry}
                                onChange={(event) => setIndustry(event.target.value)}
                                placeholder="e.g. Industrial manufacturing"
                                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        {error && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? "Setting up workspace..." : "Create workspace"}
                        </button>
                    </form>
                </div>

                <p className="mt-5 text-center text-xs text-slate-400">
                    You can update your business information later in Settings.
                </p>
            </div>
        </main>
    )
}