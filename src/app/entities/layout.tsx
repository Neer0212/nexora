import type { Metadata } from "next"
import AppShell from "@/components/layout/AppShell"

export const metadata: Metadata = {
  title: "Entity Intelligence",
  description: "Entity Intelligence",
  robots: { index: false, follow: false },
}

export default function EntitiesLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
