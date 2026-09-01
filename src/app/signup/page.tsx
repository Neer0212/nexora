"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"

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
    <main className="flex min-h-screen items-center justify-center bg-[#F1F0F8] px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-[10px] font-bold tracking-[0.2em] text-[#433D8B] uppercase">
            NEXORA
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#17153B]">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-[#68647A]">
            Start building your business workspace with Nexora.
          </p>
        </div>

        <div className="rounded-3xl border border-[#E7E4EF] bg-[#FFFFFF] p-6 sm:p-8 shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-[#17153B]"
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
                className="w-full rounded-xl border border-[#E7E4EF] px-4 py-3 text-sm text-[#17153B] outline-none transition focus:border-[#433D8B] focus:ring-2 focus:ring-[#C8ACD6]/30 placeholder:text-[#68647A]/60"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-[#17153B]"
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
                  className="w-full rounded-xl border border-[#E7E4EF] pl-4 pr-11 py-3 text-sm text-[#17153B] outline-none transition focus:border-[#433D8B] focus:ring-2 focus:ring-[#C8ACD6]/30 placeholder:text-[#68647A]/60"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#68647A] hover:text-[#17153B] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              
              <div className="mt-2 flex flex-col gap-1.5">
                  <div className={`flex items-center gap-1.5 text-xs ${password.length > 0 ? (passwordMeetsLength ? 'text-[#3C8F70]' : 'text-[#68647A]') : 'text-[#68647A]'}`}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>At least 8 characters</span>
                  </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-medium text-[#17153B]"
              >
                Confirm password
              </label>

              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-xl border border-[#E7E4EF] pl-4 pr-11 py-3 text-sm text-[#17153B] outline-none transition focus:border-[#433D8B] focus:ring-2 focus:ring-[#C8ACD6]/30 placeholder:text-[#68647A]/60"
                  placeholder="Repeat your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#68647A] hover:text-[#17153B] transition-colors"
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
              <div className="flex items-center gap-3 rounded-xl border border-[#B85454]/20 bg-[#B85454]/5 px-4 py-3 text-sm text-[#B85454]">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#17153B] px-4 py-3 text-sm font-medium text-[#FFFFFF] transition hover:bg-[#2E236C] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[#68647A]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-[#433D8B] hover:text-[#2E236C] hover:underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}