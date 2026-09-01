import type { Metadata } from "next"
import AppShell from "@/components/layout/AppShell"

export const metadata: Metadata = {
  title: "Inventory Investigation",
  description: "Inventory Investigation",
  robots: { index: false, follow: false },
}

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
