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
        <Users size={48} className="text-[#C8ACD6] mb-6" />
        <h2 className="text-2xl font-light text-[#17153B] mb-2">No entity data connected yet</h2>
        <p className="text-[#68647A] mb-8">Connect your customer or product datasets to view entity intelligence.</p>
        <Link href="/data-hub" className="bg-[#17153B] text-white px-6 py-3 rounded-xl hover:bg-[#2E236C] transition-colors">
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
            <h1 className="text-3xl font-light text-[#17153B] tracking-tight">Entity Intelligence</h1>
            <p className="text-[#68647A] mt-2">Deep dive into customers and products.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#68647A]" size={16} />
              <input
                type="text"
                placeholder="Search entities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-full border border-[#E7E4EF] bg-white focus:outline-none focus:ring-2 focus:ring-[#433D8B] text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex gap-4 mb-8 border-b border-[#E7E4EF] pb-4">
        <button onClick={() => setTab("all")} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${tab === "all" ? "bg-[#17153B] text-white" : "bg-[#F1F0F8] text-[#68647A] hover:bg-[#E7E4EF]"}`}>
          All Entities ({totalEntities})
        </button>
        <button onClick={() => setTab("customers")} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${tab === "customers" ? "bg-[#17153B] text-white" : "bg-[#F1F0F8] text-[#68647A] hover:bg-[#E7E4EF]"}`}>
          <Users size={14} /> Customers ({props.customers.length})
        </button>
        <button onClick={() => setTab("products")} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${tab === "products" ? "bg-[#17153B] text-white" : "bg-[#F1F0F8] text-[#68647A] hover:bg-[#E7E4EF]"}`}>
          <Package size={14} /> Products ({props.products.length})
        </button>
      </div>

      <div className="flex gap-8 items-start">
        {/* List Panel */}
        <div className="flex-1 bg-white rounded-3xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#F1F0F8] text-[#68647A]">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-[0.18em]">Name</th>
                  <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-[0.18em]">Type</th>
                  <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-[0.18em] text-right">Revenue</th>
                  <th className="px-6 py-4 font-medium uppercase text-[10px] tracking-[0.18em] text-right">Orders</th>
                </tr>
              </thead>
              <tbody>
                {(tab === "all" || tab === "customers") && filteredCustomers.map(c => (
                  <tr key={`c-${c.id}`} onClick={() => setSelectedEntity({ ...c, type: "Customer" })} className="border-b border-[#E7E4EF] hover:bg-[#F1F0F8] cursor-pointer transition-colors">
                    <td className="px-6 py-4 text-[#17153B] font-medium">{c.name}</td>
                    <td className="px-6 py-4 text-[#68647A]">Customer</td>
                    <td className="px-6 py-4 text-[#17153B] text-right">{formatCurrency(c.revenue, props.currencyCode)}</td>
                    <td className="px-6 py-4 text-[#68647A] text-right">{c.orders}</td>
                  </tr>
                ))}
                {(tab === "all" || tab === "products") && filteredProducts.map(p => (
                  <tr key={`p-${p.id}`} onClick={() => setSelectedEntity({ ...p, type: "Product" })} className="border-b border-[#E7E4EF] hover:bg-[#F1F0F8] cursor-pointer transition-colors">
                    <td className="px-6 py-4 text-[#17153B] font-medium">{p.name}</td>
                    <td className="px-6 py-4 text-[#68647A]">Product</td>
                    <td className="px-6 py-4 text-[#17153B] text-right">{formatCurrency(p.revenue, props.currencyCode)}</td>
                    <td className="px-6 py-4 text-[#68647A] text-right">{p.orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Panel */}
        {selectedEntity && (
          <div className="w-1/3 min-w-[300px] bg-white rounded-3xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)] p-8 sticky top-8">
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#433D8B] mb-2">{selectedEntity.type}</p>
            <h3 className="text-2xl font-light text-[#17153B] mb-6">{selectedEntity.name}</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center pb-2 border-b border-[#E7E4EF]">
                <span className="text-[#68647A] text-sm">Total Revenue</span>
                <span className="text-[#17153B] font-medium">{formatCurrency(selectedEntity.revenue, props.currencyCode)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#E7E4EF]">
                <span className="text-[#68647A] text-sm">Total Orders</span>
                <span className="text-[#17153B] font-medium">{selectedEntity.orders}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#E7E4EF]">
                <span className="text-[#68647A] text-sm">Total Units</span>
                <span className="text-[#17153B] font-medium">{selectedEntity.units}</span>
              </div>
              {selectedEntity.type === "Customer" && (
                <div className="flex justify-between items-center pb-2 border-b border-[#E7E4EF]">
                  <span className="text-[#68647A] text-sm">AOV</span>
                  <span className="text-[#17153B] font-medium">{formatCurrency(selectedEntity.averageOrderValue, props.currencyCode)}</span>
                </div>
              )}
              {selectedEntity.type === "Product" && selectedEntity.category && (
                <div className="flex justify-between items-center pb-2 border-b border-[#E7E4EF]">
                  <span className="text-[#68647A] text-sm">Category</span>
                  <span className="text-[#17153B] font-medium">{selectedEntity.category}</span>
                </div>
              )}
            </div>

            <Link href={selectedEntity.type === "Customer" ? "/customers" : "/products"} className="w-full bg-[#F1F0F8] text-[#17153B] py-3 rounded-xl font-medium hover:bg-[#E7E4EF] transition-colors flex items-center justify-center gap-2 group">
              Investigate {selectedEntity.type}s <ArrowRight size={16} className="text-[#433D8B] group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
