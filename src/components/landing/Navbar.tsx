import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-2xl border border-blue-600/15 bg-zinc-50/90 px-4 shadow-sm backdrop-blur-xl sm:px-5">
        
        {/* Brand */}
        <Link
          href="/"
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

        {/* Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#product"
            className="text-sm text-blue-600 transition-colors hover:text-zinc-950"
          >
            Product
          </a>

          <a
            href="#intelligence"
            className="text-sm text-blue-600 transition-colors hover:text-zinc-950"
          >
            Intelligence
          </a>

          <a
            href="#how-it-works"
            className="text-sm text-blue-600 transition-colors hover:text-zinc-950"
          >
            How it works
          </a>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-xl px-4 py-2.5 text-sm font-medium text-blue-800 transition hover:bg-blue-200/60 sm:block"
          >
            Log in
          </Link>

          <Link
            href="/signup"
            className="group flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-zinc-50 transition hover:bg-blue-800"
          >
            Get started

            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </nav>
    </header>
  )
}