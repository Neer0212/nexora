import type { Metadata } from "next"
import AppShell from "@/components/layout/AppShell"
export const metadata: Metadata={title:"Cross-Module Intelligence",description:"Correlate connected business signals across Nexora.",robots:{index:false,follow:false}}
export default function IntelligenceLayout({children}:{children:React.ReactNode}){return <AppShell>{children}</AppShell>}
