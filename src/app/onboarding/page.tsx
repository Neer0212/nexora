"use client"

import { FormEvent, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2, AlertCircle, ChevronDown, Store, UtensilsCrossed,
  Scissors, Dumbbell, Stethoscope, Car, GraduationCap, Hotel,
  Building2, Check
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type IndustryOption = {
  id: string
  name: string
  shortName: string
  description: string
  icon: React.ElementType
  highlights: string[]
  tier: 1 | 2 | "general"
}

const INDUSTRIES: IndustryOption[] = [
  {
    id: "retail",
    name: "Retail / Local Store",
    shortName: "Retail",
    description: "Products, inventory, POS sales, and customers.",
    icon: Store,
    highlights: ["Barcode scanning & POS", "Stock & reorder alerts", "Supplier management"],
    tier: 1,
  },
  {
    id: "restaurant",
    name: "Restaurant / Café",
    shortName: "Restaurant",
    description: "Menu, kitchen inventory, guest orders, and billing.",
    icon: UtensilsCrossed,
    highlights: ["Menu & order management", "Kitchen inventory", "Table billing via POS"],
    tier: 1,
  },
  {
    id: "salon",
    name: "Salon / Spa",
    shortName: "Salon",
    description: "Services, appointments, client history, and supplies.",
    icon: Scissors,
    highlights: ["Appointment billing via POS", "Client retention tracking", "Supplies inventory"],
    tier: 1,
  },
  {
    id: "gym",
    name: "Gym / Fitness",
    shortName: "Gym",
    description: "Members, membership plans, classes, and payments.",
    icon: Dumbbell,
    highlights: ["Membership billing via POS", "Member retention", "Equipment management"],
    tier: 1,
  },
  {
    id: "clinic",
    name: "Clinic / Dental",
    shortName: "Clinic",
    description: "Patients, appointments, consultations, and medical supplies.",
    icon: Stethoscope,
    highlights: ["Patient billing via POS", "Appointment revenue", "Medical supply management"],
    tier: 2,
  },
  {
    id: "automotive",
    name: "Automobile Service",
    shortName: "Auto Service",
    description: "Service jobs, vehicle records, parts, and technicians.",
    icon: Car,
    highlights: ["Service job billing", "Parts inventory & reorder", "Customer vehicle history"],
    tier: 2,
  },
  {
    id: "education",
    name: "Education / Coaching",
    shortName: "Education",
    description: "Students, courses, fee collection, and teachers.",
    icon: GraduationCap,
    highlights: ["Fee collection via POS", "Enrollment tracking", "Course revenue analytics"],
    tier: 2,
  },
  {
    id: "hospitality",
    name: "Hotel / Hospitality",
    shortName: "Hospitality",
    description: "Guests, rooms, reservations, and amenities.",
    icon: Hotel,
    highlights: ["Guest billing via POS", "Room revenue tracking", "Supply management"],
    tier: 2,
  },
  {
    id: "general",
    name: "Other / General Business",
    shortName: "General",
    description: "A flexible workspace that works for any business.",
    icon: Building2,
    highlights: ["All modules available", "Universal data import", "No restrictions"],
    tier: "general",
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  const [businessName, setBusinessName] = useState("")
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [currency, setCurrency] = useState("INR")

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace("/login")
        return
      }

      setLoading(false)
    }

    checkUser()
  }, [router, supabase])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (!businessName.trim()) {
      setError("Please enter your business name.")
      return
    }

    if (!selectedIndustry) {
      setError("Please select your business type.")
      return
    }

    setSubmitting(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace("/login")
      return
    }

    const { error: businessError } = await supabase.rpc("create_business", {
      p_name: businessName.trim(),
      p_business_type: selectedIndustry,
      p_industry: selectedIndustry,
    })

    if (businessError) {
      setError(
        businessError.message ||
        "We couldn't create your business. Please try again."
      )
      setSubmitting(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </main>
    )
  }

  const tier1 = INDUSTRIES.filter((i) => i.tier === 1)
  const tier2 = INDUSTRIES.filter((i) => i.tier === 2)
  const general = INDUSTRIES.filter((i) => i.tier === "general")

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-12 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="text-[10px] font-bold tracking-[0.2em] text-blue-600 uppercase">
            NEXORA
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
            Set up your workspace
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Nexora adapts its intelligence, terminology, and workflows to your business.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Business Name */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <label
              htmlFor="business-name"
              className="mb-2 block text-sm font-medium text-zinc-950"
            >
              Business name
            </label>
            <input
              id="business-name"
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Sunrise Store, FitZone Gym"
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200/30 placeholder:text-zinc-500/60"
            />

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="currency"
                  className="mb-1.5 block text-xs font-medium text-zinc-500"
                >
                  Primary currency
                </label>
                <div className="relative">
                  <select
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-4 py-2.5 pr-8 text-sm text-zinc-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200/30"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="AED">AED (د.إ)</option>
                    <option value="SGD">SGD ($)</option>
                    <option value="AUD">AUD ($)</option>
                    <option value="CAD">CAD ($)</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Industry Selection */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <p className="text-sm font-medium text-zinc-950">
                What kind of business do you run?
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Nexora will adapt its navigation, terminology, and intelligence to match.
              </p>
            </div>

            {/* Tier 1 */}
            <p className="mb-3 text-xs font-medium text-zinc-400">
              Most common
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {tier1.map((industry) => (
                <IndustryCard
                  key={industry.id}
                  industry={industry}
                  selected={selectedIndustry === industry.id}
                  onSelect={() => setSelectedIndustry(industry.id)}
                />
              ))}
            </div>

            {/* Tier 2 */}
            <p className="mb-3 mt-6 text-xs font-medium text-zinc-400">
              Specialty businesses
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {tier2.map((industry) => (
                <IndustryCard
                  key={industry.id}
                  industry={industry}
                  selected={selectedIndustry === industry.id}
                  onSelect={() => setSelectedIndustry(industry.id)}
                />
              ))}
            </div>

            {/* General */}
            <div className="mt-4">
              {general.map((industry) => (
                <IndustryCard
                  key={industry.id}
                  industry={industry}
                  selected={selectedIndustry === industry.id}
                  onSelect={() => setSelectedIndustry(industry.id)}
                  compact
                />
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-rose-600/20 bg-rose-600/5 px-4 py-3 text-sm text-rose-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !selectedIndustry}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 py-3.5 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating your workspace...</span>
              </>
            ) : (
              "Create workspace"
            )}
          </button>

          <p className="text-center text-xs text-zinc-500">
            You can change your business type later in Settings.
          </p>
        </form>
      </div>
    </main>
  )
}

function IndustryCard({
  industry,
  selected,
  onSelect,
  compact = false,
}: {
  industry: IndustryOption
  selected: boolean
  onSelect: () => void
  compact?: boolean
}) {
  const Icon = industry.icon

  if (compact) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={[
          "flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition",
          selected
            ? "border-blue-600 bg-zinc-100 ring-1 ring-blue-600"
            : "border-zinc-200 hover:border-blue-200 hover:bg-[#FAFAFA]",
        ].join(" ")}
      >
        <div className={[
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          selected ? "bg-blue-600 text-white" : "bg-zinc-50 text-zinc-500",
        ].join(" ")}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-950">{industry.name}</p>
          <p className="mt-0.5 text-xs text-zinc-500">{industry.description}</p>
        </div>
        {selected && (
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600">
            <Check className="h-3 w-3 text-white" />
          </div>
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "group flex flex-col gap-3 rounded-xl border p-4 text-left transition",
        selected
          ? "border-blue-600 bg-zinc-100 ring-1 ring-blue-600"
          : "border-zinc-200 hover:border-blue-200 hover:bg-[#FAFAFA]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between">
        <div className={[
          "flex h-9 w-9 items-center justify-center rounded-lg",
          selected ? "bg-blue-600 text-white" : "bg-zinc-50 text-zinc-500 group-hover:bg-zinc-200",
        ].join(" ")}>
          <Icon className="h-4 w-4" />
        </div>
        {selected && (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
            <Check className="h-3 w-3 text-white" />
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-950">{industry.shortName}</p>
        <p className="mt-0.5 text-xs leading-5 text-zinc-500">{industry.description}</p>
      </div>
      <ul className="space-y-1">
        {industry.highlights.map((h) => (
          <li key={h} className="flex items-center gap-1.5 text-[10px] text-zinc-400">
            <span className="h-1 w-1 rounded-full bg-blue-200" />
            {h}
          </li>
        ))}
      </ul>
    </button>
  )
}