import type { Metadata } from "next"
import AppShell from "@/components/layout/AppShell"

export const metadata: Metadata = {
  title: "Supplier Investigation",
  description: "Supplier Investigation",
  robots: { index: false, follow: false },
}

export default function SuppliersLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
