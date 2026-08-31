import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

export default function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[#F1F0F8]">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />

        <main className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}