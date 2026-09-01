import type { Metadata } from "next"
import AppShell from "@/components/layout/AppShell"

export const metadata: Metadata = {
  title: "Customer Intelligence",
  description: "Customer Intelligence",
  robots: { index: false, follow: false },
}

export default function CustomersLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
