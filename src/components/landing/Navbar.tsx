"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Menu, X } from "lucide-react"
import { useState } from "react"

const navigation = [
  { label: "Product", href: "#product" },
  { label: "Intelligence", href: "#intelligence" },
  { label: "How it works", href: "#how-it-works" },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <nav className="mx-auto max-w-7xl rounded-2xl border border-[#534B52]/15 bg-[#F1F0EA]/90 shadow-[0_8px_30px_rgba(45,35,46,0.06)] backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4 sm:px-5">
          {/* Brand */}
          <Link
            href="/"
            onClick={closeMenu}
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl"
            aria-label="Nexora home"
          >
            <Image
              src="/nexora.logo.png"
              alt="Nexora"
              width={40}
              height={40}
              priority
              className="h-10 w-10 object-contain"
            />
          </Link>

          {/* Desktop navigation */}
          <div className="hidden items-center gap-8 md:flex">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-[#534B52] transition-colors hover:text-[#2D232E]"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-[#474448] transition hover:bg-[#E0DDCF]/60"
            >
              Log in
            </Link>

            <Link
              href="/signup"
              className="group flex items-center gap-2 rounded-xl bg-[#2D232E] px-4 py-2.5 text-sm font-medium text-[#F1F0EA] transition hover:bg-[#474448]"
            >
              Get started

              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#534B52]/10 bg-white/50 text-[#474448] transition hover:bg-[#E0DDCF]/60 md:hidden"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Mobile navigation */}
        {menuOpen && (
          <div className="border-t border-[#534B52]/10 px-4 pb-4 md:hidden">
            <div className="pt-3">
              <div className="space-y-1">
                {navigation.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className="block rounded-xl px-3 py-3 text-sm font-medium text-[#534B52] transition hover:bg-[#E0DDCF]/60 hover:text-[#2D232E]"
                  >
                    {item.label}
                  </a>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#534B52]/10 pt-3">
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="rounded-xl border border-[#534B52]/15 px-4 py-3 text-center text-sm font-medium text-[#474448] transition hover:bg-[#E0DDCF]/60"
                >
                  Log in
                </Link>

                <Link
                  href="/signup"
                  onClick={closeMenu}
                  className="rounded-xl bg-[#2D232E] px-4 py-3 text-center text-sm font-medium text-[#F1F0EA] transition hover:bg-[#474448]"
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}