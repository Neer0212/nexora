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
      <div className="bg-white p-8 rounded-xl border border-zinc-200 shadow-sm text-center max-w-md w-full">
        <div className="w-16 h-16 bg-rose-600/10 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-600">
          <span title="Error"><AlertCircle className="w-8 h-8" /></span>
        </div>
        <h2 className="text-2xl font-semibold text-zinc-950 mb-2">Something went wrong!</h2>
        <p className="text-zinc-500 mb-8">We couldn&apos;t load your suppliers. Please try again.</p>
        <button
          onClick={() => reset()}
          className="w-full py-3 bg-zinc-950 text-white rounded-xl font-medium hover:bg-blue-800 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
