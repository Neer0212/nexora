import type { Metadata } from "next"

import AppShell from "@/components/layout/AppShell"

export const metadata: Metadata = {
  title: "Finance",
  description: "Understand revenue, costs, margins, and profitability from connected Nexora business data.",
  alternates: { canonical: "/finance" },
  robots: { index: false, follow: false },
}

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}
