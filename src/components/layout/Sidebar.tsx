"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { IndustryConfig } from "@/lib/industries"
import {
  Activity, Bell, Brain, Boxes, Building2, ChevronDown,
  ClipboardCheck, Database, FileSearch, FileText, FolderKanban,
  MessageCircleQuestion, PackageSearch, Sparkles, Target, TrendingUp,
  User, Users, Package, LineChart, ShoppingCart, Receipt, Store,
  Truck, Wallet, UserCircle, UtensilsCrossed, Scissors, Dumbbell,
  Stethoscope, Car, GraduationCap, Hotel, CalendarCheck
} from "lucide-react"

// Icon map — maps string icon names from IndustryConfig to Lucide components
const ICON_MAP: Record<string, React.ElementType> = {
  Activity, Bell, Brain, Boxes, Building2, ChevronDown,
  ClipboardCheck, Database, FileSearch, FileText, FolderKanban,
  MessageCircleQuestion, PackageSearch, Sparkles, Target, TrendingUp,
  User, Users, Package, LineChart, ShoppingCart, Receipt, Store,
  Truck, Wallet, UserCircle, UtensilsCrossed, Scissors, Dumbbell,
  Stethoscope, Car, GraduationCap, Hotel, CalendarCheck,
}

function getIcon(name: string): React.ElementType {
  return ICON_MAP[name] ?? Store
}

// Static nav sections that don't change by industry
const understandNav = [
  { label: "Overview", href: "/dashboard", icon: Activity },
  { label: "Business Brain", href: "/brain", icon: Brain },
  { label: "Finance", href: "/finance", icon: TrendingUp },
  { label: "Operations", href: "/operations", icon: Activity },
  { label: "Intelligence", href: "/intelligence", icon: Sparkles },
  { label: "Data Hub", href: "/data-hub", icon: Database },
]

const investigateNav = [
  { label: "Business Autopsy", href: "/autopsy", icon: FileSearch },
  { label: "Entities", href: "/entities", icon: Building2 },
  { label: "Inventory", href: "/inventory", icon: Boxes },
  { label: "Suppliers", href: "/suppliers", icon: PackageSearch },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "What Changed", href: "/changes", icon: TrendingUp },
]

const decideNav = [
  { label: "Actions", href: "/actions", icon: ClipboardCheck },
  { label: "Alerts", href: "/alerts", icon: Bell },
  { label: "Ask Nexora", href: "/ask", icon: MessageCircleQuestion },
  { label: "Reports", href: "/reports", icon: FileText },
]

const intelligenceNav = [
  { label: "Goals & Targets", href: "/goals", icon: Target },
  { label: "Forecasting", href: "/forecasting", icon: LineChart },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Products", href: "/products", icon: Package },
]

function NavItem({
  href,
  label,
  icon: Icon,
  pathname,
}: {
  href: string
  label: string
  icon: React.ElementType
  pathname: string
}) {
  const isActive = href === "/pos"
    ? pathname === "/pos"
    : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      data-active={isActive ? "true" : undefined}
      className={[
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-zinc-100 font-medium text-zinc-950"
          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950",
      ].join(" ")}
    >
      <Icon
        className={[
          "h-[17px] w-[17px] shrink-0",
          isActive
            ? "text-zinc-950"
            : "text-zinc-400 group-hover:text-blue-600",
        ].join(" ")}
        strokeWidth={1.8}
      />
      <span>{label}</span>
    </Link>
  )
}

function Section({
  label,
  items,
  pathname,
}: {
  label: string
  items: Array<{ label: string; href: string; icon: React.ElementType }>
  pathname: string
}) {
  return (
    <div className="mt-6">
      {label && (
        <p className="mb-2 px-3 text-xs font-semibold text-zinc-900">
          {label}
        </p>
      )}
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavItem key={item.href} {...item} pathname={pathname} />
        ))}
      </div>
    </div>
  )
}

import { useEffect, useRef } from "react"

export default function Sidebar({ industryConfig }: { industryConfig: IndustryConfig }) {
  const pathname = usePathname()
  const navContainerRef = useRef<HTMLDivElement>(null)

  // Preserve and restore scroll position across Next.js route navigation
  useEffect(() => {
    const container = navContainerRef.current
    if (!container) return

    const savedScroll = sessionStorage.getItem("nexora_sidebar_scroll")
    if (savedScroll !== null) {
      container.scrollTop = Number(savedScroll)
    }

    // Ensure the active item is visible in view
    const activeItem = container.querySelector("[data-active='true']")
    if (activeItem) {
      activeItem.scrollIntoView({ block: "nearest", behavior: "instant" })
    }
  }, [pathname])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    sessionStorage.setItem("nexora_sidebar_scroll", String(e.currentTarget.scrollTop))
  }

  // Build operations nav from industry config, resolving icon names to components
  const operationsItems = industryConfig.navigation.operationsItems.map((item) => ({
    ...item,
    icon: getIcon(item.icon),
  }))

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 self-start border-r border-zinc-200 bg-white lg:flex lg:flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-zinc-200 px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-zinc-950">
            nexora
          </span>
        </Link>
      </div>

      {/* Nav with custom sleek scrollbar and scroll restoration */}
      <div
        ref={navContainerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-200 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-400"
      >
        {/* Business switcher */}
        <Link
          href="/dashboard"
          className="mb-4 flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-zinc-50"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white shadow-sm">
              <Building2 className="h-4 w-4 text-zinc-700" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-950">
                Your Business
              </p>
              <p className="text-xs text-zinc-500">
                {industryConfig.shortName}
              </p>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-zinc-400" />
        </Link>

        {/* Industry-aware operations */}
        <Section
          label={industryConfig.navigation.operationsLabel}
          items={operationsItems}
          pathname={pathname}
        />

        {/* Static core sections with visible category names */}
        <Section label="Understand" items={understandNav} pathname={pathname} />
        <Section label="Investigate" items={investigateNav} pathname={pathname} />
        <Section label="Planning & Assets" items={intelligenceNav} pathname={pathname} />
        <Section label="Decide & Assist" items={decideNav} pathname={pathname} />
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-200 p-3">
        <NavItem href="/profile" label="Profile" icon={User} pathname={pathname} />
      </div>
    </aside>
  )
}
