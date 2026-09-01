import type { Metadata } from "next"

import AppShell from "@/components/layout/AppShell"

export const metadata: Metadata = {
  title: "Nexora POS",
  description: "Point of sale and operational data entry for your Nexora workspace.",
  robots: { index: false, follow: false },
}

export default function POSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}
