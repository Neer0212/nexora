import type { Metadata } from "next"
import AppShell from "@/components/layout/AppShell"

export const metadata: Metadata = {
  title: "Business Reports",
  description: "Create a concise business report from connected Nexora data.",
  alternates: { canonical: "/reports" },
  robots: { index: false, follow: false },
}

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
