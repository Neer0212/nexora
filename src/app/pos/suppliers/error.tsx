"use client"

import { useEffect } from "react"
import { AlertCircle } from "lucide-react"

export default function SuppliersError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[50vh]">
      <div className="bg-white p-8 rounded-3xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)] text-center max-w-md w-full">
        <div className="w-16 h-16 bg-[#B85454]/10 rounded-full flex items-center justify-center mx-auto mb-6 text-[#B85454]">
          <span title="Error"><AlertCircle className="w-8 h-8" /></span>
        </div>
        <h2 className="text-2xl font-semibold text-[#17153B] mb-2">Something went wrong!</h2>
        <p className="text-[#68647A] mb-8">We couldn't load your suppliers. Please try again.</p>
        <button
          onClick={() => reset()}
          className="w-full py-3 bg-[#17153B] text-white rounded-xl font-medium hover:bg-[#2E236C] transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
