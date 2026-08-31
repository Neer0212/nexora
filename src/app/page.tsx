import Navbar from "@/components/landing/Navbar"
import Hero from "@/components/landing/Hero"
import IntelligenceSection from "@/components/landing/IntelligenceSection"
import dynamic from "next/dynamic"

const BrainSection = dynamic(() => import("@/components/landing/BrainSection"))
const AutopsySection = dynamic(() => import("@/components/landing/AutopsySection"))
const BusinessTypes = dynamic(() => import("@/components/landing/BusinessTypes"))
import FinalCTA from "@/components/landing/FinalCTA"
import Footer from "@/components/landing/Footer"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Business Intelligence, Connected",
  description:
    "Connect your business data, understand what is changing, explain why it matters, and decide what to do next with Nexora.",
  alternates: { canonical: "/" },
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F1F0F8] text-[#17153B]">
      <Navbar />

      <Hero />

      <IntelligenceSection />

      <BrainSection />

      <AutopsySection />

      <BusinessTypes />

      <FinalCTA />

      <Footer />
    </main>
  )
}