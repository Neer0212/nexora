import type { Metadata } from "next"
import AppShell from "@/components/layout/AppShell"

export const metadata: Metadata = {
  title: "Actions & Recommendations",
  description: "Turn Nexora business signals into trackable actions.",
  alternates: { canonical: "/actions" },
  robots: { index: false, follow: false },
}

export default function ActionsLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}