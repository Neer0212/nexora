"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { updateBusinessIndustry } from "@/app/profile/actions"
import { getTier1Industries, getTier2Industries } from "@/lib/industries/registry"

const ALL_INDUSTRIES = [
  ...getTier1Industries(),
  ...getTier2Industries(),
  { id: "general", shortName: "General / Other", description: "Standard terminology." }
]

export default function ProfileIndustrySection({ 
  businessId, 
  currentIndustry,
  currentType
}: { 
  businessId: string; 
  currentIndustry: string;
  currentType: string | null;
}) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [selectedId, setSelectedId] = useState(currentIndustry)
  const [isLoading, setIsLoading] = useState(false)

  const currentConfig = ALL_INDUSTRIES.find(i => i.id === currentIndustry) || ALL_INDUSTRIES.find(i => i.id === "general")!

  const handleSave = async () => {
    if (selectedId === currentIndustry) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    try {
      const selectedConfig = ALL_INDUSTRIES.find(i => i.id === selectedId)!
      await updateBusinessIndustry(businessId, selectedId, selectedConfig.shortName)
      setIsEditing(false)
      router.refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="pl-7">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-widest text-[#9A94A8]">
          Industry Context
        </p>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="text-[10px] font-medium text-[#433D8B] hover:underline"
          >
            Change
          </button>
        )}
      </div>

      {!isEditing ? (
        <div className="mt-1">
          <p className="text-sm font-medium text-[#17153B]">{currentConfig.shortName}</p>
          <p className="text-xs text-[#68647A] mt-0.5">{currentConfig.description}</p>
        </div>
      ) : (
        <div className="mt-2 space-y-3">
          <select 
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={isLoading}
            className="w-full rounded-xl border border-[#E7E4EF] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] disabled:opacity-50"
          >
            <optgroup label="Primary Industries">
              {getTier1Industries().map(ind => (
                <option key={ind.id} value={ind.id}>{ind.shortName}</option>
              ))}
            </optgroup>
            <optgroup label="Specialized Industries">
              {getTier2Industries().map(ind => (
                <option key={ind.id} value={ind.id}>{ind.shortName}</option>
              ))}
            </optgroup>
            <optgroup label="Other">
              <option value="general">General / Other</option>
            </optgroup>
          </select>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="inline-flex h-8 items-center justify-center rounded-lg bg-[#17153B] px-4 text-[11px] font-medium text-white transition hover:bg-[#2E236C] disabled:opacity-50"
            >
              {isLoading && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
              Save Industry
            </button>
            <button
              onClick={() => {
                setSelectedId(currentIndustry)
                setIsEditing(false)
              }}
              disabled={isLoading}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-[#E7E4EF] px-4 text-[11px] font-medium text-[#17153B] transition hover:bg-[#F8F8FB]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
