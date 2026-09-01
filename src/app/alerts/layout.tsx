import type { Metadata } from "next"
import AppShell from "@/components/layout/AppShell"

export const metadata: Metadata = {
  title: "Alerts & Monitoring",
  description: "Monitor important business changes and operational risks.",
  alternates: { canonical: "/alerts" },
  robots: { index: false, follow: false },
}

export default function AlertsLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
