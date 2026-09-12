import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

type Breadcrumb = { label: string; href?: string }

export default function Breadcrumbs({ items }: { items: Breadcrumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500"
    >
      <Link
        href="/dashboard"
        aria-label="Dashboard"
        className="inline-flex items-center rounded-md p-1 transition hover:bg-zinc-200 hover:text-zinc-950"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3 text-zinc-500/40" />
          {item.href ? (
            <Link href={item.href} className="transition hover:text-zinc-950">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="font-medium text-zinc-900">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
