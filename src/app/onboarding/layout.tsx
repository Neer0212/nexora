import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Set up your business",
  description: "Set up your Nexora business workspace and prepare it for connected data.",
  alternates: { canonical: "/onboarding" },
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
