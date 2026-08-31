import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-2xl border border-[#433D8B]/15 bg-[#F1F0F8]/90 px-4 shadow-[0_8px_30px_rgba(45,35,46,0.06)] backdrop-blur-xl sm:px-5">
        
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
            className="text-sm text-[#433D8B] transition-colors hover:text-[#17153B]"
          >
            Product
          </a>

          <a
            href="#intelligence"
            className="text-sm text-[#433D8B] transition-colors hover:text-[#17153B]"
          >
            Intelligence
          </a>

          <a
            href="#how-it-works"
            className="text-sm text-[#433D8B] transition-colors hover:text-[#17153B]"
          >
            How it works
          </a>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-xl px-4 py-2.5 text-sm font-medium text-[#2E236C] transition hover:bg-[#C8ACD6]/60 sm:block"
          >
            Log in
          </Link>

          <Link
            href="/signup"
            className="group flex items-center gap-2 rounded-xl bg-[#17153B] px-4 py-2.5 text-sm font-medium text-[#F1F0F8] transition hover:bg-[#2E236C]"
          >
            Get started

            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </nav>
    </header>
  )
}