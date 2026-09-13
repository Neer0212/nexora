"use client"

import { Printer } from "lucide-react"

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer"
    >
      <Printer className="w-4 h-4" /> Print
    </button>
  )
}
