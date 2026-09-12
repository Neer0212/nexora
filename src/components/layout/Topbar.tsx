"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Bell, Menu, User, LogOut, Building2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function Topbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [menuOpen])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 sm:px-6">
      <button
        type="button"
        className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
        </button>

        {/* Profile menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950 text-xs font-medium text-white transition-opacity hover:opacity-90"
            aria-label="Profile menu"
            aria-expanded={menuOpen}
          >
            N
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-sm">
              <Link
                href="/profile"
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-950 transition-colors hover:bg-zinc-50"
                onClick={() => setMenuOpen(false)}
              >
                <User className="h-4 w-4 text-zinc-500" />
                Profile
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-950 transition-colors hover:bg-zinc-50"
                onClick={() => setMenuOpen(false)}
              >
                <Building2 className="h-4 w-4 text-zinc-500" />
                Workspace
              </Link>
              <div className="my-1 border-t border-zinc-200" />
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 transition-colors hover:bg-[#FFF5F5]"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}