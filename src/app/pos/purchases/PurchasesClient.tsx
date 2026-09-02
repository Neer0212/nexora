"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Filter, X, Trash2, Package, Ban, FileText } from "lucide-react"
import { createPurchase, cancelPurchase } from "./actions"

type Purchase = {
  id: string
  purchase_number: string
  order_date: string
  expected_date: string | null
  status: string
  payment_status: string
  total_amount: number
  supplier?: { id: string, name: string }
}

type Product = {
  id: string
  name: string
  sku: string
  barcode: string
  unit_cost: number
  stock_quantity: number
}

type Supplier = {
  id: string
  name: string
}

export default function PurchasesClient({ businessId, purchases, products, suppliers }: { businessId: string, purchases: Purchase[], products: Product[], suppliers: Supplier[] }) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  
  const [supplierId, setSupplierId] = useState("")
  const [expectedDate, setExpectedDate] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState([{ product_id: "", quantity: 1, unit_cost: 0 }])

  const [loading, setLoading] = useState(false)

  const filteredPurchases = purchases.filter(p => {
    const matchesSearch = p.purchase_number.toLowerCase().includes(search.toLowerCase()) || 
                          (p.supplier?.name || "").toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">Draft</span>
      case 'ordered': return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">Ordered</span>
      case 'partial': return <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">Partial</span>
      case 'received': return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Received</span>
      case 'cancelled': return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Cancelled</span>
      default: return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">{status}</span>
    }
  }

  const handleAddItem = () => {
    setItems([...items, { product_id: "", quantity: 1, unit_cost: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items]
    if (field === "product_id") {
      const prod = products.find(p => p.id === value)
      newItems[index] = { ...newItems[index], product_id: value, unit_cost: prod ? prod.unit_cost : 0 }
    } else {
      newItems[index] = { ...newItems[index], [field]: value }
    }
    setItems(newItems)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierId || items.some(i => !i.product_id || i.quantity <= 0)) return
    
    setLoading(true)
    const payload = {
      supplier_id: supplierId,
      expected_date: expectedDate,
      notes,
      items
    }
    const res = await createPurchase(businessId, payload)
    setLoading(false)
    if (res.success) {
      setIsCreateModalOpen(false)
      setSupplierId("")
      setExpectedDate("")
      setNotes("")
      setItems([{ product_id: "", quantity: 1, unit_cost: 0 }])
      router.refresh()
    } else {
      alert(res.error)
    }
  }

  const handleCancelPurchase = async (purchaseId: string) => {
    if (confirm("Are you sure you want to cancel this purchase?")) {
      const res = await cancelPurchase(businessId, purchaseId)
      if (res.success) {
        router.refresh()
      } else {
        alert(res.error)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#433D8B]">Stock-In</h2>
          <h1 className="text-3xl font-semibold tracking-tight text-[#17153B] sm:text-4xl mt-1">Purchase Orders</h1>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 bg-[#17153B] text-white px-4 py-2.5 rounded-xl hover:bg-[#2E236C] transition-colors active:scale-[0.98]"
        >
          <span title="Create PO"><Plus className="h-4 w-4" /></span>
          New Purchase Order
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)] overflow-hidden">
        <div className="p-6 border-b border-[#E7E4EF] flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <span title="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A94A8]">
              <Search className="h-5 w-5" />
            </span>
            <input
              type="text"
              placeholder="Search by PO number or supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#D9D5E4] rounded-xl focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none"
            />
          </div>
          <div className="relative min-w-[200px]">
            <span title="Filter" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A94A8]">
              <Filter className="h-5 w-5" />
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#D9D5E4] rounded-xl focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none appearance-none bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="ordered">Ordered</option>
              <option value="partial">Partial</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7F5FA] border-b border-[#E7E4EF] text-[#68647A]">
              <tr>
                <th className="px-6 py-4 font-semibold">PO Number</th>
                <th className="px-6 py-4 font-semibold">Supplier</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Total</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E4EF]">
              {filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-medium text-[#17153B]">
                    {purchase.purchase_number}
                  </td>
                  <td className="px-6 py-4 text-[#68647A]">
                    {purchase.supplier?.name || "Unknown"}
                  </td>
                  <td className="px-6 py-4 text-[#68647A]">
                    {new Date(purchase.order_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(purchase.status)}
                  </td>
                  <td className="px-6 py-4 font-medium text-[#17153B]">
                    ₹{purchase.total_amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {(purchase.status === 'ordered' || purchase.status === 'partial') && (
                      <button 
                        title="Receive Items"
                        className="p-2 text-[#3C8F70] hover:bg-[#3C8F70]/10 rounded-lg transition-colors inline-flex active:scale-[0.98]"
                      >
                        <span title="Receive"><Package className="h-4 w-4" /></span>
                      </button>
                    )}
                    {(purchase.status === 'draft' || purchase.status === 'ordered') && (
                      <button 
                        title="Cancel Purchase"
                        onClick={() => handleCancelPurchase(purchase.id)}
                        className="p-2 text-[#B85454] hover:bg-[#B85454]/10 rounded-lg transition-colors inline-flex active:scale-[0.98]"
                      >
                        <span title="Cancel"><Ban className="h-4 w-4" /></span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#68647A]">
                    <div className="flex flex-col items-center justify-center">
                      <span title="Empty"><FileText className="h-10 w-10 text-[#D9D5E4] mb-3" /></span>
                      <p className="font-medium text-[#17153B]">No purchase orders found</p>
                      <p className="text-sm mt-1">Try adjusting your filters or create a new one.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-[#E7E4EF] flex justify-between items-center bg-[#F7F5FA]">
              <h3 className="text-xl font-semibold text-[#17153B]">Create Purchase Order</h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#9A94A8] hover:text-[#17153B] transition-colors p-1"
              >
                <span title="Close"><X className="h-5 w-5" /></span>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="create-po-form" onSubmit={handleCreateSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#17153B] mb-2">Supplier *</label>
                    <select
                      required
                      value={supplierId}
                      onChange={(e) => setSupplierId(e.target.value)}
                      className="w-full px-4 py-2 border border-[#D9D5E4] rounded-xl focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none bg-white"
                    >
                      <option value="">Select a supplier</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#17153B] mb-2">Expected Date</label>
                    <input
                      type="date"
                      value={expectedDate}
                      onChange={(e) => setExpectedDate(e.target.value)}
                      className="w-full px-4 py-2 border border-[#D9D5E4] rounded-xl focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#17153B] mb-2">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-[#D9D5E4] rounded-xl focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none resize-none"
                    placeholder="Optional notes for this purchase..."
                  />
                </div>

                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-semibold text-[#17153B]">Order Items</h4>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#433D8B] hover:text-[#2E236C]"
                    >
                      <span title="Add"><Plus className="h-4 w-4" /></span>
                      Add Item
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={index} className="flex gap-3 items-end p-4 bg-[#F7F5FA] rounded-xl border border-[#E7E4EF]">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-[#68647A] mb-1">Product *</label>
                          <select
                            required
                            value={item.product_id}
                            onChange={(e) => handleItemChange(index, "product_id", e.target.value)}
                            className="w-full px-3 py-2 border border-[#D9D5E4] rounded-lg focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none bg-white text-sm"
                          >
                            <option value="">Select product</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_quantity})</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <label className="block text-xs font-medium text-[#68647A] mb-1">Quantity *</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-[#D9D5E4] rounded-lg focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none text-sm"
                          />
                        </div>
                        <div className="w-32">
                          <label className="block text-xs font-medium text-[#68647A] mb-1">Unit Cost (₹) *</label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={item.unit_cost}
                            onChange={(e) => handleItemChange(index, "unit_cost", parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-[#D9D5E4] rounded-lg focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none text-sm"
                          />
                        </div>
                        <div className="w-28 bg-white px-3 py-2 border border-[#E7E4EF] rounded-lg text-sm font-medium text-[#17153B] flex items-center h-[38px]">
                          ₹{(item.quantity * item.unit_cost).toFixed(2)}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          disabled={items.length === 1}
                          className="p-2 text-[#9A94A8] hover:text-[#B85454] disabled:opacity-30 transition-colors h-[38px] flex items-center justify-center"
                        >
                          <span title="Remove"><Trash2 className="h-5 w-5" /></span>
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <div className="bg-[#F7F5FA] px-6 py-4 rounded-xl border border-[#E7E4EF] flex items-center gap-4">
                      <span className="text-[#68647A] font-medium">Total Amount:</span>
                      <span className="text-2xl font-semibold text-[#17153B]">
                        ₹{items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-[#E7E4EF] bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-5 py-2.5 text-[#68647A] font-medium hover:text-[#17153B] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-po-form"
                disabled={loading}
                className="bg-[#17153B] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[#2E236C] transition-colors disabled:opacity-70 flex items-center gap-2 active:scale-[0.98]"
              >
                {loading ? "Creating..." : "Create Purchase Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
