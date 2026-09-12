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
      className={[
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-[#F0EEF6] font-medium text-[#17153B]"
          : "text-[#68647A] hover:bg-[#F1F0F8] hover:text-[#17153B]",
      ].join(" ")}
    >
      <Icon
        className={[
          "h-[17px] w-[17px] shrink-0",
          isActive
            ? "text-[#17153B]"
            : "text-[#9A94A8] group-hover:text-[#433D8B]",
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
    <div className="mt-7">
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9A94A8]">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavItem key={item.href} {...item} pathname={pathname} />
        ))}
      </div>
    </div>
  )
}

export default function Sidebar({ industryConfig }: { industryConfig: IndustryConfig }) {
  const pathname = usePathname()

  // Build operations nav from industry config, resolving icon names to components
  const operationsItems = industryConfig.navigation.operationsItems.map((item) => ({
    ...item,
    icon: getIcon(item.icon),
  }))

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 self-start border-r border-[#E7E4EF] bg-white lg:flex lg:flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-[#E7E4EF] px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#17153B]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-[#17153B]">
            nexora
          </span>
        </Link>
      </div>

      {/* Nav */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {/* Business switcher */}
        <Link
          href="/dashboard"
          className="mb-2 flex items-center justify-between rounded-lg border border-[#E7E4EF] px-3 py-2.5 transition-colors hover:bg-[#F1F0F8]"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#F0EEF6]">
              <Building2 className="h-3.5 w-3.5 text-[#68647A]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-[#2E236C]">
                Your Business
              </p>
              <p className="text-[10px] text-[#9A94A8]">
                {industryConfig.shortName}
              </p>
            </div>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-[#9A94A8]" />
        </Link>

        {/* Industry-aware operations */}
        <Section
          label={industryConfig.navigation.operationsLabel}
          items={operationsItems}
          pathname={pathname}
        />

        {/* Static core sections */}
        <Section label="Understand" items={understandNav} pathname={pathname} />
        <Section label="Investigate" items={investigateNav} pathname={pathname} />
        <Section label="Intelligence" items={intelligenceNav} pathname={pathname} />
        <Section label="Decide" items={decideNav} pathname={pathname} />
      </div>

      {/* Footer */}
      <div className="border-t border-[#E7E4EF] p-3">
        <NavItem href="/profile" label="Profile" icon={User} pathname={pathname} />
      </div>
    </aside>
  )
}
