import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

type Business = {
  id: string
  name: string
  industry: string | null
  businessType: string | null
  currencyCode: string
}

type User = {
  email: string
  role: string
}

export default function AppShell({
  children,
  business,
  user,
}: {
  children: React.ReactNode
  business: Business
  user: User
}) {
  return (
    <div className="flex min-h-screen bg-[#F1F0EA] text-[#2D232E]">
      <Sidebar business={business} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar business={business} user={user} />

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}