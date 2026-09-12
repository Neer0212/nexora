"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"

import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
    const router = useRouter()
    const supabase = createClient()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
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
        <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
            <div className="w-full max-w-md">
                <div className="mb-8">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-blue-600 uppercase">
                        NEXORA
                    </p>

                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
                        Welcome back
                    </h1>

                    <p className="mt-2 text-sm text-zinc-500">
                        Sign in to continue to your business workspace.
                    </p>
                </div>

                <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-medium text-zinc-950"
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
                                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200/30 placeholder:text-zinc-500/60"
                                placeholder="you@company.com"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-medium text-zinc-950"
                            >
                                Password
                            </label>

                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    className="w-full rounded-xl border border-zinc-200 pl-4 pr-11 py-3 text-sm text-zinc-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200/30 placeholder:text-zinc-500/60"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-950 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 rounded-xl border border-rose-600/20 bg-rose-600/5 px-4 py-3 text-sm text-rose-600">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                "Sign in"
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-zinc-500">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/signup"
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline underline-offset-4"
                        >
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    )
}