"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react"

import { createClient } from "@/lib/supabase/client"

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const passwordMeetsLength = password.length >= 8

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError("")

    if (!passwordMeetsLength) {
      setError("Password must be at least 8 characters.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.session) {
      router.push("/onboarding")
      router.refresh()
      return
    }

    setLoading(false)
    router.push("/login?message=check-email")
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#FAFAFC] px-4 py-12 sm:px-6">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute top-10 right-1/4 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-1/4 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Brand header */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 transition-transform hover:scale-105"
          >
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl shadow-sm">
              <Image
                src="/nexora.logo.png"
                alt="Nexora"
                width={44}
                height={44}
                priority
                className="h-11 w-11 object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-950">
              nexora
            </span>
          </Link>
          <h1 className="mt-6 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Set up your intelligent store and business workspace.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-zinc-200/80 bg-white p-7 sm:p-9 shadow-xl shadow-zinc-950/5 backdrop-blur-xl">
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-600"
              >
                Business Email
              </label>

              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-zinc-400"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-600"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-4 pr-11 py-3 text-sm text-zinc-950 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-zinc-400"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="mt-2 flex items-center gap-1.5 text-xs">
                <CheckCircle2
                  className={`h-3.5 w-3.5 ${
                    passwordMeetsLength ? "text-emerald-600" : "text-zinc-400"
                  }`}
                />
                <span
                  className={
                    passwordMeetsLength ? "text-emerald-700 font-medium" : "text-zinc-500"
                  }
                >
                  Minimum 8 characters
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-600"
              >
                Confirm Password
              </label>

              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 pl-4 pr-11 py-3 text-sm text-zinc-950 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-zinc-400"
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-600 hover:shadow-blue-600/25 disabled:opacity-60 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating workspace...
                </>
              ) : (
                <>
                  Create Workspace
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-7 text-center border-t border-zinc-100 pt-6">
            <p className="text-xs text-zinc-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-600 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}