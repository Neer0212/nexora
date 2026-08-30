"use client"

import { Bell, Menu } from "lucide-react"

export default function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <button
        type="button"
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
        </button>

        <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-medium text-white">
          N
        </div>
      </div>
    </header>
  )
}