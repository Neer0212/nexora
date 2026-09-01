import type { Metadata } from "next"
import AppShell from "@/components/layout/AppShell"

export const metadata: Metadata = {
  title: "Goals & Targets",
  description: "Goals & Targets",
  robots: { index: false, follow: false },
}

export default function GoalsLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
