import type { Metadata } from "next"

import AppShell from "@/components/layout/AppShell"

export const metadata: Metadata = {
  title: "Business Overview",
  description: "Review the latest signals across your Nexora business workspace.",
  alternates: { canonical: "/dashboard" },
  robots: { index: false, follow: false },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}
