import type { Metadata } from "next"
export const metadata: Metadata={title:"Redirecting",robots:{index:false,follow:false}}
export default function RedirectingPage(){return <main className="flex min-h-screen items-center justify-center bg-[#F1F0F8] px-6"><div className="max-w-md text-center"><p className="text-5xl font-semibold tracking-[-0.04em] text-[#17153B]">303</p><h1 className="mt-4 text-2xl font-semibold text-[#17153B]">Redirecting</h1><p className="mt-2 text-sm leading-6 text-[#68647A]">This route is reserved for future redirect flows.</p></div></main>}
