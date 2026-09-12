import { Database, Upload } from "lucide-react"
import Link from "next/link"

type EmptyStateProps = {
  icon?: React.ReactNode
  title: string
  description: string
  ctaLabel?: string
  ctaHref?: string
}

/**
 * Reusable empty state component for pages with no data.
 *
 * Shows an icon, title, description, and optional CTA button.
 * Used across all analytical pages when no connected data exists.
 */
export default function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaHref,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-50">
          {icon ?? <Database className="h-6 w-6 text-blue-600" />}
        </div>

        <h3 className="text-base font-semibold text-zinc-950">{title}</h3>

        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          {description}
        </p>

        {ctaLabel && ctaHref && (
          <Link
            href={ctaHref}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800"
          >
            <Upload className="h-3.5 w-3.5" />
            {ctaLabel}
          </Link>
        )}
      </div>
    </div>
  )
}
