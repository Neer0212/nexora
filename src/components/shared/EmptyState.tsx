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
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F0F8]">
          {icon ?? <Database className="h-6 w-6 text-[#433D8B]" />}
        </div>

        <h3 className="text-base font-semibold text-[#17153B]">{title}</h3>

        <p className="mt-2 text-sm leading-relaxed text-[#68647A]">
          {description}
        </p>

        {ctaLabel && ctaHref && (
          <Link
            href={ctaHref}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#433D8B] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#2E236C]"
          >
            <Upload className="h-3.5 w-3.5" />
            {ctaLabel}
          </Link>
        )}
      </div>
    </div>
  )
}
