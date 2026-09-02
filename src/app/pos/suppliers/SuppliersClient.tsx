"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Pencil, Mail, Phone, MapPin, ChevronDown, ChevronUp, Package, IndianRupee, X } from "lucide-react"
import { saveSupplier, getSupplierActivity } from "./actions"

type Supplier = {
  id: string
  name: string
  code: string | null
  email: string | null
  phone: string | null
  contact_name: string | null
  location: string | null
  status: string
}

export default function SuppliersClient({ 
  businessId, 
  suppliers,
  purchaseAggregates
}: { 
  businessId: string
  suppliers: Supplier[]
  purchaseAggregates: Record<string, number>
}) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [supplierActivity, setSupplierActivity] = useState<any>(null)
  const [loadingActivity, setLoadingActivity] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    email: "",
    phone: "",
    contact_name: "",
    location: "",
    status: "Active"
  })

  const filteredSuppliers = suppliers.filter(s => {
    const term = search.toLowerCase()
    return s.name.toLowerCase().includes(term) || 
           (s.code && s.code.toLowerCase().includes(term)) ||
           (s.contact_name && s.contact_name.toLowerCase().includes(term))
  })

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier)
      setFormData({
        name: supplier.name,
        code: supplier.code || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        contact_name: supplier.contact_name || "",
        location: supplier.location || "",
        status: supplier.status || "Active"
      })
    } else {
      setEditingSupplier(null)
      setFormData({
        name: "",
        code: "",
        email: "",
        phone: "",
        contact_name: "",
        location: "",
        status: "Active"
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await saveSupplier(businessId, {
        id: editingSupplier?.id,
        ...formData
      } as any)
      setIsModalOpen(false)
      router.refresh()
    } catch (error) {
      console.error(error)
      alert("Failed to save supplier")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    
    setExpandedId(id)
    setLoadingActivity(true)
    try {
      const activity = await getSupplierActivity(businessId, id)
      setSupplierActivity(activity)
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingActivity(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#17153B] sm:text-4xl">Suppliers</h1>
          <p className="text-[#68647A] mt-1">Manage your suppliers, vendors, and purchase history</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#17153B] text-white px-4 py-2.5 rounded-xl hover:bg-[#2E236C] transition-colors active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          <span>Add Supplier</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)] overflow-hidden">
        <div className="p-4 border-b border-[#E7E4EF]">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9A94A8]" />
            <input
              type="text"
              placeholder="Search by name, code or contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#D9D5E4] rounded-xl focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F5FA] border-b border-[#E7E4EF]">
                <th className="px-6 py-4 font-semibold text-[#68647A] text-sm w-8"></th>
                <th className="px-6 py-4 font-semibold text-[#68647A] text-sm">Supplier Info</th>
                <th className="px-6 py-4 font-semibold text-[#68647A] text-sm">Contact</th>
                <th className="px-6 py-4 font-semibold text-[#68647A] text-sm">Total Spend</th>
                <th className="px-6 py-4 font-semibold text-[#68647A] text-sm">Status</th>
                <th className="px-6 py-4 font-semibold text-[#68647A] text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#9A94A8]">
                    No suppliers found.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <React.Fragment key={supplier.id}>
                    <tr className="border-b border-[#E7E4EF] hover:bg-[#F7F5FA]/50 transition-colors">
                      <td className="px-6 py-4">
                        <button onClick={() => toggleExpand(supplier.id)} className="text-[#68647A] hover:text-[#17153B]">
                          {expandedId === supplier.id ? (
                            <span title="Collapse"><ChevronUp className="w-5 h-5" /></span>
                          ) : (
                            <span title="Expand"><ChevronDown className="w-5 h-5" /></span>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[#17153B]">{supplier.name}</span>
                          {supplier.code && <span className="text-xs text-[#68647A]">Code: {supplier.code}</span>}
                          {supplier.location && (
                            <span className="text-xs text-[#68647A] flex items-center gap-1 mt-1">
                              <span title="Location"><MapPin className="w-3 h-3" /></span> {supplier.location}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-[#17153B]">{supplier.contact_name || "-"}</span>
                          {supplier.phone && (
                            <span className="text-xs text-[#68647A] flex items-center gap-1">
                              <span title="Phone"><Phone className="w-3 h-3" /></span> {supplier.phone}
                            </span>
                          )}
                          {supplier.email && (
                            <span className="text-xs text-[#68647A] flex items-center gap-1">
                              <span title="Email"><Mail className="w-3 h-3" /></span> {supplier.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-[#17153B]">
                          ₹{(purchaseAggregates[supplier.id] || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {supplier.status === 'Active' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#3C8F70]/10 text-[#3C8F70]">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#68647A]/10 text-[#68647A]">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenModal(supplier)}
                          className="p-1.5 text-[#68647A] hover:bg-[#F1F0F8] hover:text-[#433D8B] rounded-lg transition-colors inline-block"
                        >
                          <span title="Edit"><Pencil className="w-4 h-4" /></span>
                        </button>
                      </td>
                    </tr>
                    
                    {expandedId === supplier.id && (
                      <tr className="bg-[#F7F5FA] border-b border-[#E7E4EF]">
                        <td colSpan={6} className="px-6 py-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#433D8B] mb-3 flex items-center gap-2">
                                <span title="Recent Purchases"><IndianRupee className="w-3.5 h-3.5" /></span> Recent Purchases
                              </h4>
                              {loadingActivity ? (
                                <p className="text-sm text-[#68647A]">Loading...</p>
                              ) : supplierActivity?.purchases?.length > 0 ? (
                                <ul className="space-y-3">
                                  {supplierActivity.purchases.map((p: any) => (
                                    <li key={p.id} className="bg-white p-3 rounded-xl border border-[#E7E4EF] flex justify-between items-center shadow-sm">
                                      <div>
                                        <p className="text-sm font-medium text-[#17153B]">{p.description || p.category}</p>
                                        <p className="text-xs text-[#68647A]">{new Date(p.expense_date).toLocaleDateString()}</p>
                                      </div>
                                      <span className="text-sm font-semibold text-[#17153B]">₹{Number(p.amount).toFixed(2)}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-[#68647A] bg-white p-3 rounded-xl border border-[#E7E4EF]">No recent purchases found.</p>
                              )}
                            </div>
                            
                            <div>
                              <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#433D8B] mb-3 flex items-center gap-2">
                                <span title="Recent Inventory"><Package className="w-3.5 h-3.5" /></span> Inventory Received
                              </h4>
                              {loadingActivity ? (
                                <p className="text-sm text-[#68647A]">Loading...</p>
                              ) : supplierActivity?.transactions?.length > 0 ? (
                                <ul className="space-y-3">
                                  {supplierActivity.transactions.map((t: any) => (
                                    <li key={t.id} className="bg-white p-3 rounded-xl border border-[#E7E4EF] flex justify-between items-center shadow-sm">
                                      <div>
                                        <p className="text-sm font-medium text-[#17153B]">{t.variant?.product?.name} ({t.variant?.sku})</p>
                                        <p className="text-xs text-[#68647A]">{new Date(t.created_at).toLocaleDateString()}</p>
                                      </div>
                                      <span className="text-sm font-semibold text-[#3C8F70]">+{t.quantity}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-[#68647A] bg-white p-3 rounded-xl border border-[#E7E4EF]">No inventory received from this supplier.</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#17153B]/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-[0_12px_35px_rgba(23,21,59,0.1)] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#E7E4EF] flex justify-between items-center bg-white z-10">
              <h2 className="text-xl font-semibold text-[#17153B]">
                {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-[#9A94A8] hover:bg-[#F1F0F8] hover:text-[#17153B] rounded-xl transition-colors"
              >
                <span title="Close"><X className="w-5 h-5" /></span>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#17153B] mb-1.5">Supplier Name*</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 border border-[#D9D5E4] rounded-xl focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none transition-shadow"
                    placeholder="E.g. ABC Distributors"
                  />
                </div>
                
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-[#17153B] mb-1.5">Supplier Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    className="w-full px-4 py-2.5 border border-[#D9D5E4] rounded-xl focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none transition-shadow"
                    placeholder="E.g. SUP-001"
                  />
                </div>
                
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-[#17153B] mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-2.5 border border-[#D9D5E4] rounded-xl focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none transition-shadow bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-[#17153B] mb-1.5">Contact Name</label>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                    className="w-full px-4 py-2.5 border border-[#D9D5E4] rounded-xl focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none transition-shadow"
                    placeholder="John Doe"
                  />
                </div>
                
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-[#17153B] mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2.5 border border-[#D9D5E4] rounded-xl focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none transition-shadow"
                    placeholder="+91 9876543210"
                  />
                </div>
                
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-[#17153B] mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2.5 border border-[#D9D5E4] rounded-xl focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none transition-shadow"
                    placeholder="contact@supplier.com"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#17153B] mb-1.5">Location / Address</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-4 py-2.5 border border-[#D9D5E4] rounded-xl focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none transition-shadow"
                    placeholder="123 Market Street, City"
                  />
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-[#E7E4EF]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-medium text-[#68647A] hover:bg-[#F1F0F8] hover:text-[#17153B] rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 text-sm font-medium bg-[#17153B] text-white rounded-xl hover:bg-[#2E236C] transition-colors active:scale-[0.98] disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
