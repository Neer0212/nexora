import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create a Nexora account and start building your connected business workspace.",
  alternates: { canonical: "/signup" },
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
