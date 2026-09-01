import { redirect } from "next/navigation"
import AskNexora from "@/components/ask/AskNexora"
import { getBusinessSnapshot } from "@/lib/business-snapshot"
import { createClient } from "@/lib/supabase/server"

export default async function AskPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const snapshot = await getBusinessSnapshot()
  return <AskNexora snapshot={snapshot} />
}
