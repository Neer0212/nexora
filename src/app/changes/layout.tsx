import type { Metadata } from "next"
import AppShell from "@/components/layout/AppShell"

export const metadata: Metadata = {
  title: "What Changed",
  description: "What Changed",
  robots: { index: false, follow: false },
}

export default function ChangesLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
