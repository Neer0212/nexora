"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity, BarChart3, Bell, Brain, Boxes, Building2, ChevronDown,
  ClipboardCheck, Database, FileSearch, FileText, FolderKanban, Lightbulb,
  MessageCircleQuestion, PackageSearch, Settings, Sparkles, Target, TrendingUp,
  Users, Package, LineChart,
} from "lucide-react"

const navigation = [
  { label: "Overview", href: "/dashboard", icon: Activity },
  { label: "Business Brain", href: "/brain", icon: Brain },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Finance", href: "/finance", icon: TrendingUp },
  { label: "Operations", href: "/operations", icon: Activity },
  { label: "Intelligence", href: "/intelligence", icon: Sparkles },
  { label: "Data Hub", href: "/data-hub", icon: Database },
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
  { label: "Actions", href: "/actions", icon: ClipboardCheck },
  { label: "Alerts", href: "/alerts", icon: Bell },
  { label: "Ask Nexora", href: "/ask", icon: MessageCircleQuestion },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Simulator", href: "/simulator", icon: Sparkles },
  { label: "Recommendations", href: "/recommendations", icon: Lightbulb },
]

const intelligence = [
  { label: "Goals & Targets", href: "/goals", icon: Target },
  { label: "Forecasting", href: "/forecasting", icon: LineChart },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Products", href: "/products", icon: Package },
]

function NavItem({ href, label, icon: Icon, pathname }: { href: string; label: string; icon: React.ElementType; pathname: string }) {
  const active = pathname === href || pathname.startsWith(`${href}/`)
  return <Link href={href} className={["group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors", active ? "bg-[#F0EEF6] font-medium text-[#17153B]" : "text-[#68647A] hover:bg-[#F1F0F8] hover:text-[#17153B]"].join(" ")}>
    <Icon className={["h-[17px] w-[17px] shrink-0", active ? "text-[#17153B]" : "text-[#9A94A8] group-hover:text-[#433D8B]"].join(" ")} strokeWidth={1.8} />
    <span>{label}</span>
  </Link>
}

function Section({ label, items, pathname }: { label: string; items: Array<{ label: string; href: string; icon: React.ElementType }>; pathname: string }) {
  return <div className="mt-7"><p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9A94A8]">{label}</p><div className="space-y-0.5">{items.map((item) => <NavItem key={item.href} {...item} pathname={pathname} />)}</div></div>
}

export default function Sidebar() {
  const pathname = usePathname()
  return <aside className="sticky top-0 hidden h-screen w-64 shrink-0 self-start border-r border-[#E7E4EF] bg-[#FFFFFF] lg:flex lg:flex-col">
    <div className="flex h-16 items-center border-b border-[#E7E4EF] px-5"><Link href="/dashboard" className="flex items-center gap-2.5"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#17153B]"><Sparkles className="h-4 w-4 text-[#FFFFFF]" /></div><span className="text-[15px] font-semibold tracking-tight text-[#17153B]">nexora</span></Link></div>
    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
      <Link href="/dashboard" className="mb-2 flex items-center justify-between rounded-lg border border-[#E7E4EF] px-3 py-2.5 transition-colors hover:bg-[#F1F0F8]"><div className="flex min-w-0 items-center gap-2.5"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#F0EEF6]"><Building2 className="h-3.5 w-3.5 text-[#68647A]" /></div><div className="min-w-0"><p className="truncate text-xs font-medium text-[#2E236C]">Your Business</p><p className="text-[10px] text-[#9A94A8]">Workspace</p></div></div><ChevronDown className="h-3.5 w-3.5 text-[#9A94A8]" /></Link>
      <Section label="Understand" items={navigation} pathname={pathname} />
      <Section label="Investigate" items={investigate} pathname={pathname} />
      <Section label="Intelligence" items={intelligence} pathname={pathname} />
      <Section label="Decide" items={decide} pathname={pathname} />
    </div>
    <div className="border-t border-[#E7E4EF] p-3"><NavItem href="/settings" label="Settings" icon={Settings} pathname={pathname} /></div>
  </aside>
}
