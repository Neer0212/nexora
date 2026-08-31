"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  BarChart3,
  Brain,
  Boxes,
  Building2,
  ChevronDown,
  FileSearch,
  FolderKanban,
  Lightbulb,
  PackageSearch,
  Settings,
  Sparkles,
  TrendingUp,
} from "lucide-react"

type Business = {
  id: string
  name: string
  industry: string | null
  businessType: string | null
  currencyCode: string
}

const navigation = [
  { label: "Overview", href: "/dashboard", icon: Activity },
  { label: "Business Brain", href: "/brain", icon: Brain },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
]

const investigate = [
  { label: "Business Autopsy", href: "/autopsy", icon: FileSearch },
  { label: "Entities", href: "/entities", icon: Building2 },
  { label: "Inventory", href: "/inventory", icon: Boxes },
  { label: "Suppliers", href: "/suppliers", icon: PackageSearch },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "What Changed", href: "/changes", icon: TrendingUp },
]

const decide = [
  { label: "Simulator", href: "/simulator", icon: Sparkles },
  { label: "Recommendations", href: "/recommendations", icon: Lightbulb },
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
  const active = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      className={[
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
        active
          ? "bg-[#2D232E] font-medium text-[#F1F0EA] shadow-sm"
          : "text-[#534B52] hover:bg-[#E0DDCF]/65 hover:text-[#2D232E]",
      ].join(" ")}
    >
      <Icon
        className={[
          "h-[17px] w-[17px] shrink-0",
          active
            ? "text-[#E0DDCF]"
            : "text-[#534B52]/55 group-hover:text-[#2D232E]",
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
  items: typeof navigation
  pathname: string
}) {
  return (
    <div className="mt-7">
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#534B52]/40">
        {label}
      </p>

      <div className="space-y-1">
        {items.map((item) => (
          <NavItem key={item.href} {...item} pathname={pathname} />
        ))}
      </div>
    </div>
  )
}

export default function Sidebar({ business }: { business: Business }) {
  const pathname = usePathname()

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 self-start border-r border-[#534B52]/10 bg-[#F1F0EA] lg:flex lg:flex-col">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center border-b border-[#534B52]/10 px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image
            src="/nexora.logo.png"
            alt="Nexora"
            width={34}
            height={34}
            className="h-8 w-8 object-contain"
          />

          <span className="text-[15px] font-semibold tracking-tight text-[#2D232E]">
            nexora
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {/* Business switcher */}
        <Link
          href="/dashboard"
          className="mb-2 flex items-center justify-between rounded-xl border border-[#534B52]/10 bg-white/55 px-3 py-2.5 transition-colors hover:bg-white"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#E0DDCF]/65">
              <Building2 className="h-3.5 w-3.5 text-[#534B52]" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-[#2D232E]">
                {business.name}
              </p>

              <p className="truncate text-[10px] text-[#534B52]/50">
                {business.businessType || business.industry || "Workspace"}
              </p>
            </div>
          </div>

          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#534B52]/45" />
        </Link>

        <Section
          label="Understand"
          items={navigation}
          pathname={pathname}
        />

        <Section
          label="Investigate"
          items={investigate}
          pathname={pathname}
        />

        <Section
          label="Decide"
          items={decide}
          pathname={pathname}
        />
      </div>

      {/* Settings */}
      <div className="shrink-0 border-t border-[#534B52]/10 bg-[#F1F0EA] p-3">
        <NavItem
          href="/settings"
          label="Settings"
          icon={Settings}
          pathname={pathname}
        />
      </div>
    </aside>
  )
}