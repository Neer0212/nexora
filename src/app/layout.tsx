import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Nexora — Business intelligence, connected.",
    template: "%s | Nexora",
  },
  description:
    "Nexora connects business data, explains what is changing, and helps teams decide what to do next.",
  applicationName: "Nexora",
  generator: "Next.js",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Nexora",
    url: siteUrl,
    logo: `${siteUrl}/nexora.logo.png`,
    description:
      "Nexora connects business data, explains what is changing, and helps teams decide what to do next.",
  }

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Nexora",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Business intelligence software that connects business data, explains changes, and supports better decisions.",
    url: siteUrl,
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
      </body>
    </html>
  )
}
