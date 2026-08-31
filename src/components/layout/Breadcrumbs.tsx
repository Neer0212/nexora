import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

type Breadcrumb = { label: string; href?: string }

export default function Breadcrumbs({ items }: { items: Breadcrumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-[#68647A]"
    >
      <Link
        href="/dashboard"
        aria-label="Dashboard"
        className="inline-flex items-center rounded-md p-1 transition hover:bg-[#E7E4EF] hover:text-[#17153B]"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3 text-[#68647A]/40" />
          {item.href ? (
            <Link href={item.href} className="transition hover:text-[#17153B]">
              {item.label}
            </Link>
          ) : (
            <span aria-current="page" className="font-medium text-[#433D8B]">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
