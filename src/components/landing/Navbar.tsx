"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-6">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-2xl border border-zinc-200/80 bg-white/85 px-4 shadow-sm backdrop-blur-xl transition-all sm:px-6 hover:border-zinc-300">
        
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
          aria-label="Nexora home"
        >
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl shadow-sm">
            <Image
              src="/nexora.logo.png"
              alt="Nexora"
              width={36}
              height={36}
              priority
              className="h-9 w-9 object-contain"
            />
          </div>
          <span className="text-base font-bold tracking-tight text-zinc-950">
            nexora
          </span>
        </Link>

        {/* Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#product"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-blue-600"
          >
            Capabilities
          </a>

          <a
            href="#how-it-works"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-blue-600"
          >
            Business Autopsy
          </a>

          <Link
            href="/dashboard"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-blue-600"
          >
            Dashboard
          </Link>

          <Link
            href="/brain"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-blue-600"
          >
            Business Brain
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 sm:block"
          >
            Sign in
          </Link>

          <Link
            href="/signup"
            className="group flex items-center gap-1.5 rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-600 hover:shadow-blue-600/20 active:scale-[0.98]"
          >
            Get started
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </nav>
    </header>
  )
}