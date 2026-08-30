"use client"

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

const navigation = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: Activity,
  },
  {
    label: "Business Brain",
    href: "/brain",
    icon: Brain,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
]

const investigate = [
  {
    label: "Business Autopsy",
    href: "/autopsy",
    icon: FileSearch,
  },
  {
    label: "Entities",
    href: "/entities",
    icon: Building2,
  },
  {
    label: "Inventory",
    href: "/inventory",
    icon: Boxes,
  },
  {
    label: "Suppliers",
    href: "/suppliers",
    icon: PackageSearch,
  },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    label: "What Changed",
    href: "/changes",
    icon: TrendingUp,
  },
]

const decide = [
  {
    label: "Simulator",
    href: "/simulator",
    icon: Sparkles,
  },
  {
    label: "Recommendations",
    href: "/recommendations",
    icon: Lightbulb,
  },
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
  const active =
    pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      className={[
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-slate-100 font-medium text-slate-900"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
      ].join(" ")}
    >
      <Icon
        className={[
          "h-[17px] w-[17px] shrink-0",
          active
            ? "text-slate-900"
            : "text-slate-400 group-hover:text-slate-700",
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
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>

      <div className="space-y-0.5">
        {items.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            pathname={pathname}
          />
        ))}
      </div>
    </div>
  )
}

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b border-slate-200 px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
            <Sparkles className="h-4 w-4 text-white" />
          </div>

          <span className="text-[15px] font-semibold tracking-tight text-slate-900">
            nexora
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <Link
          href="/dashboard"
          className="mb-2 flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 transition-colors hover:bg-slate-50"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100">
              <Building2 className="h-3.5 w-3.5 text-slate-600" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-800">
                Your Business
              </p>

              <p className="text-[10px] text-slate-400">
                Workspace
              </p>
            </div>
          </div>

          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
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

      <div className="border-t border-slate-200 p-3">
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