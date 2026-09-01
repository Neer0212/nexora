import type { Metadata } from "next"
import AppShell from "@/components/layout/AppShell"

export const metadata: Metadata = {
  title: "Business Autopsy",
  description: "Investigate business health and root causes.",
  robots: { index: false, follow: false },
}

export default function AutopsyLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
