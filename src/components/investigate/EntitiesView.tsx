"use client"

import { useState } from "react"
import Link from "next/link"
import Breadcrumbs from "@/components/layout/Breadcrumbs"
import { formatCurrency } from "@/lib/data-utils"
import { Search, ArrowRight, Package, Users } from "lucide-react"

type EntitiesData = {
  businessName: string
  currencyCode: string
  latestDate: string | null
  datasets: string[]
  customers: Array<{ id: string; name: string; orders: number; revenue: number; units: number; averageOrderValue: number; share: number }>
  products: Array<{ id: string; name: string; orders: number; revenue: number; units: number; share: number; category: string }>
}

type SelectedEntity =
  | (EntitiesData["customers"][number] & { type: "Customer" })
  | (EntitiesData["products"][number] & { type: "Product"; category?: string })
  | null

export default function EntitiesView(props: EntitiesData) {
  const [tab, setTab] = useState<"all" | "customers" | "products">("all")
  const [search, setSearch] = useState("")
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity>(null)

  const filteredCustomers = props.customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
  const filteredProducts = props.products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  const totalEntities = props.customers.length + props.products.length

  if (totalEntities === 0) {
    return (
      <div className="max-w-[1500px] mx-auto p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Users size={48} className="text-blue-200 mb-6" />
        <h2 className="text-2xl font-light text-zinc-950 mb-2">No entity data connected yet</h2>
        <p className="text-zinc-500 mb-8">Connect your customer or product datasets to view entity intelligence.</p>
        <Link href="/data-hub" className="bg-zinc-950 text-white px-6 py-3 rounded-xl hover:bg-blue-800 transition-colors">
          Go to Data Hub
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-[1500px] mx-auto p-8 space-y-8">
      {/* Header */}
      <div>
        <Breadcrumbs items={[
          { label: "Investigate", href: "/investigate" },
          { label: "Entity Intelligence", href: "/entities" }
        ]} />
        <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-light text-zinc-950 tracking-tight">Entity Intelligence</h1>
            <p className="text-zinc-500 mt-2">Deep dive into customers and products.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="text"
                placeholder="Search entities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-full border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex gap-4 mb-8 border-b border-zinc-200 pb-4">
        <button onClick={() => setTab("all")} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${tab === "all" ? "bg-zinc-950 text-white" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-200"}`}>
          All Entities ({totalEntities})
        </button>
        <button onClick={() => setTab("customers")} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${tab === "customers" ? "bg-zinc-950 text-white" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-200"}`}>
          <Users size={14} /> Customers ({props.customers.length})
        </button>
        <button onClick={() => setTab("products")} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${tab === "products" ? "bg-zinc-950 text-white" : "bg-zinc-50 text-zinc-500 hover:bg-zinc-200"}`}>
          <Package size={14} /> Products ({props.products.length})
        </button>
      </div>

      <div className="flex gap-8 items-start">
        {/* List Panel */}
        <div className="flex-1 bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 text-zinc-500">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-[0.18em]">Name</th>
                  <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-[0.18em]">Type</th>
                  <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-[0.18em] text-right">Revenue</th>
                  <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-[0.18em] text-right">Orders</th>
                </tr>
              </thead>
              <tbody>
                {(tab === "all" || tab === "customers") && filteredCustomers.map(c => (
                  <tr key={`c-${c.id}`} onClick={() => setSelectedEntity({ ...c, type: "Customer" })} className="border-b border-zinc-200 hover:bg-zinc-50 cursor-pointer transition-colors">
                    <td className="px-6 py-4 text-zinc-950 font-medium">{c.name}</td>
                    <td className="px-6 py-4 text-zinc-500">Customer</td>
                    <td className="px-6 py-4 text-zinc-950 text-right">{formatCurrency(c.revenue, props.currencyCode)}</td>
                    <td className="px-6 py-4 text-zinc-500 text-right">{c.orders}</td>
                  </tr>
                ))}
                {(tab === "all" || tab === "products") && filteredProducts.map(p => (
                  <tr key={`p-${p.id}`} onClick={() => setSelectedEntity({ ...p, type: "Product" })} className="border-b border-zinc-200 hover:bg-zinc-50 cursor-pointer transition-colors">
                    <td className="px-6 py-4 text-zinc-950 font-medium">{p.name}</td>
                    <td className="px-6 py-4 text-zinc-500">Product</td>
                    <td className="px-6 py-4 text-zinc-950 text-right">{formatCurrency(p.revenue, props.currencyCode)}</td>
                    <td className="px-6 py-4 text-zinc-500 text-right">{p.orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        {selectedEntity && (
          <div className="w-1/3 min-w-[300px] bg-white rounded-3xl border border-zinc-200 shadow-sm p-8 sticky top-8">
            <p className="text-xs font-medium font-semibold text-blue-600 mb-2">{selectedEntity.type}</p>
            <h3 className="text-2xl font-light text-zinc-950 mb-6">{selectedEntity.name}</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
                <span className="text-zinc-500 text-sm">Total Revenue</span>
                <span className="text-zinc-950 font-medium">{formatCurrency(selectedEntity.revenue, props.currencyCode)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
                <span className="text-zinc-500 text-sm">Total Orders</span>
                <span className="text-zinc-950 font-medium">{selectedEntity.orders}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
                <span className="text-zinc-500 text-sm">Total Units</span>
                <span className="text-zinc-950 font-medium">{selectedEntity.units}</span>
              </div>
              {selectedEntity.type === "Customer" && (
                <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
                  <span className="text-zinc-500 text-sm">AOV</span>
                  <span className="text-zinc-950 font-medium">{formatCurrency(selectedEntity.averageOrderValue, props.currencyCode)}</span>
                </div>
              )}
              {selectedEntity.type === "Product" && selectedEntity.category && (
                <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
                  <span className="text-zinc-500 text-sm">Category</span>
                  <span className="text-zinc-950 font-medium">{selectedEntity.category}</span>
                </div>
              )}
            </div>

            <Link href={selectedEntity.type === "Customer" ? "/customers" : "/products"} className="w-full bg-zinc-50 text-zinc-950 py-3 rounded-xl font-medium hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 group">
              Investigate {selectedEntity.type}s <ArrowRight size={16} className="text-blue-600 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
