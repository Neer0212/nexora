import type { Metadata } from "next"
import AppShell from "@/components/layout/AppShell"

export const metadata: Metadata = {
  title: "Ask Nexora",
  description: "Ask questions about the business data connected to Nexora.",
  alternates: { canonical: "/ask" },
  robots: { index: false, follow: false },
}

export default function AskLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
