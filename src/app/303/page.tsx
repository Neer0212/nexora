import type { Metadata } from "next"
export const metadata: Metadata={title:"Redirecting",robots:{index:false,follow:false}}
export default function RedirectingPage(){return <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6"><div className="max-w-md text-center"><p className="text-5xl font-semibold tracking-tight text-zinc-950">303</p><h1 className="mt-4 text-2xl font-semibold text-zinc-950">Redirecting</h1><p className="mt-2 text-sm leading-6 text-zinc-500">This route is reserved for future redirect flows.</p></div></main>}
