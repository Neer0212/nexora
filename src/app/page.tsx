import Navbar from "@/components/landing/Navbar"
import Hero from "@/components/landing/Hero"
import IntelligenceSection from "@/components/landing/IntelligenceSection"
import BrainSection from "@/components/landing/BrainSection"
import AutopsySection from "@/components/landing/AutopsySection"
import BusinessTypes from "@/components/landing/BusinessTypes"
import FinalCTA from "@/components/landing/FinalCTA"
import Footer from "@/components/landing/Footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FFFFFF] text-[#12102F]">
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