import type { Metadata } from "next"
import AppShell from "@/components/layout/AppShell"

export const metadata: Metadata = {
  title: "Revenue Forecasting",
  description: "Revenue Forecasting",
  robots: { index: false, follow: false },
}

export default function ForecastingLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
