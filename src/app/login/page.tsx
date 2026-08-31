"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
    const router = useRouter()
    const supabase = createClient()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        setError("")
        setLoading(true)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }

        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            setError("We couldn't verify your account. Please try again.")
            setLoading(false)
            return
        }

        const { data: membership, error: membershipError } = await supabase
            .from("business_users")
            .select("business_id")
            .eq("user_id", user.id)
            .limit(1)
            .maybeSingle()

        if (membershipError) {
            setError(membershipError.message)
            setLoading(false)
            return
        }

        if (membership) {
            router.push("/dashboard")
        } else {
            router.push("/onboarding")
        }

        router.refresh()
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#F1F0F8] px-6">
            <div className="w-full max-w-md">
                <div className="mb-8">
                    <p className="text-sm font-semibold tracking-wide text-blue-600">
                        NEXORA
                    </p>

                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#17153B]">
                        Welcome back
                    </h1>

                    <p className="mt-2 text-sm text-[#68647A]">
                        Sign in to continue to your business workspace.
                    </p>
                </div>

                <div className="rounded-2xl border border-[#E7E4EF] bg-[#FFFFFF] p-6 shadow-sm">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-medium text-[#433D8B]"
                            >
                                Email
                            </label>

                            <input
                                id="email"
                                type="email"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                className="w-full rounded-lg border border-[#E7E4EF] px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                placeholder="you@company.com"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-medium text-[#433D8B]"
                            >
                                Password
                            </label>

                            <input
                                id="password"
                                type="password"
                                required
                                autoComplete="current-password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                className="w-full rounded-lg border border-[#E7E4EF] px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-[#17153B] px-4 py-2.5 text-sm font-medium text-[#FFFFFF] transition hover:bg-[#2E236C] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-[#68647A]">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/signup"
                            className="font-medium text-blue-600 hover:text-blue-700"
                        >
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    )
}