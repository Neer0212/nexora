"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, Brain, Menu, X } from "lucide-react"
import { useState } from "react"

import { createClient } from "@/lib/supabase/client"

type Business = {
  id: string
  name: string
  industry: string | null
  businessType: string | null
  currencyCode: string
}

type User = {
  email: string
  role: string
}

const mobileLinks = [
  { label: "Overview", href: "/dashboard" },
  { label: "Business Brain", href: "/brain" },
  { label: "Analytics", href: "/analytics" },
  { label: "Inventory", href: "/inventory" },
  { label: "Suppliers", href: "/suppliers" },
]

export default function Topbar({
  business,
  user,
}: {
  business: Business
  user: User
}) {
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const initials = user.email?.trim().charAt(0).toUpperCase() || "N"

  async function handleSignOut() {
    setSigningOut(true)

    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace("/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#534B52]/10 bg-[#F1F0EA]/90 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="rounded-xl p-2 text-[#534B52] transition hover:bg-[#E0DDCF]/60 lg:hidden"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-[#2D232E]">
              {business.name}
            </p>

            <p className="hidden text-[10px] text-[#534B52]/45 sm:block">
              Business workspace
            </p>
          </div>
        </div>

        <div className="relative flex items-center gap-2">
          <button
            type="button"
            className="relative rounded-xl p-2 text-[#534B52] transition-colors hover:bg-[#E0DDCF]/60 hover:text-[#2D232E]"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#534B52]" />
          </button>

          <button
            type="button"
            onClick={() => setAccountOpen((open) => !open)}
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#2D232E] text-xs font-medium text-[#F1F0EA] transition hover:bg-[#474448]"
            aria-label="Open account menu"
            aria-expanded={accountOpen}
          >
            {initials}
          </button>

          {accountOpen && (
            <div className="absolute right-0 top-12 w-60 overflow-hidden rounded-2xl border border-[#534B52]/10 bg-white shadow-[0_18px_50px_rgba(45,35,46,0.14)]">
              <div className="border-b border-[#534B52]/10 px-4 py-3">
                <p className="truncate text-xs font-medium text-[#2D232E]">
                  {user.email}
                </p>

                <p className="mt-1 text-[10px] capitalize text-[#534B52]/50">
                  {user.role}
                </p>
              </div>

              <div className="p-2">
                <Link
                  href="/settings"
                  onClick={() => setAccountOpen(false)}
                  className="block rounded-xl px-3 py-2.5 text-xs text-[#534B52] transition hover:bg-[#F1F0EA] hover:text-[#2D232E]"
                >
                  Settings
                </Link>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full rounded-xl px-3 py-2.5 text-left text-xs text-[#534B52] transition hover:bg-[#F1F0EA] hover:text-[#2D232E] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {signingOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#534B52]/10 px-4 pb-4 lg:hidden">
          <div className="grid gap-1 pt-3 sm:grid-cols-2">
            {mobileLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-3 text-xs font-medium text-[#534B52] transition hover:bg-[#E0DDCF]/60 hover:text-[#2D232E]"
              >
                {item.label === "Business Brain" && (
                  <Brain className="h-3.5 w-3.5" />
                )}
                {item.label !== "Business Brain" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#534B52]/35" />
                )}
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}