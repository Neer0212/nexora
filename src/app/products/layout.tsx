import type { Metadata } from "next"
import AppShell from "@/components/layout/AppShell"

export const metadata: Metadata = {
  title: "Product Intelligence",
  description: "Product Intelligence",
  robots: { index: false, follow: false },
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
