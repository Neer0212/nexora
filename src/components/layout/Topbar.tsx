"use client"

import { Bell, Menu } from "lucide-react"

export default function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-[#E7E4EF] bg-[#FFFFFF] px-4 sm:px-6">
      <button
        type="button"
        className="rounded-lg p-2 text-[#68647A] hover:bg-[#F0EEF6] lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-lg p-2 text-[#68647A] transition-colors hover:bg-[#F0EEF6] hover:text-[#17153B]"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
        </button>

        <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#17153B] text-xs font-medium text-[#FFFFFF]">
          N
        </div>
      </div>
    </header>
  )
}