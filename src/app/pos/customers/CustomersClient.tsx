"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, X, Edit2, Loader2, Users, ChevronDown, ChevronUp, UserCheck, UserPlus, ShoppingBag, MapPin, Mail, Phone } from "lucide-react"
import { saveCustomer, getCustomerHistory, type CustomerFormValues } from "./actions"

type Customer = {
  id: string
  name: string
  email: string | null
  phone: string | null
  type: string
  location: string | null
  created_at: string
}

type OrderData = {
  customer_id: string | null
  total_amount: number
  order_date: string
}

type OrderHistory = {
  id: string
  order_number: string
  order_date: string
  total_amount: number
  status: string
  payment_method: string
}

export default function CustomersClient({ businessId, customers, orderData }: { businessId: string, customers: Customer[], orderData: OrderData[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [search, setSearch] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [historyData, setHistoryData] = useState<Record<string, OrderHistory[]>>({})
  const [loadingHistory, setLoadingHistory] = useState<Record<string, boolean>>({})

  const [form, setForm] = useState<CustomerFormValues>({
    name: "", email: "", phone: "", type: "Individual", location: ""
  })

  // Stats
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  const totalCustomers = customers.length
  
  const activeCustomerIds = new Set(
    orderData
      .filter(o => o.customer_id && new Date(o.order_date) >= thirtyDaysAgo)
      .map(o => o.customer_id)
  )
  const activeCustomers = activeCustomerIds.size
  
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const newThisMonth = customers.filter(c => new Date(c.created_at) >= thisMonth).length

  // Aggregations
  const customerStats = customers.map(c => {
    const cOrders = orderData.filter(o => o.customer_id === c.id)
    return {
      ...c,
      totalOrders: cOrders.length,
      totalSpent: cOrders.reduce((sum, o) => sum + Number(o.total_amount), 0)
    }
  })

  const filtered = customerStats.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
    (c.phone && c.phone.includes(search))
  )

  const handleEdit = (c: Customer, e: React.MouseEvent) => {
    e.stopPropagation()
    setForm({
      id: c.id,
      name: c.name,
      email: c.email || "",
      phone: c.phone || "",
      type: c.type as "Individual" | "Business" | "Wholesale",
      location: c.location || ""
    })
    setError(null)
    setShowModal(true)
  }

  const handleAdd = () => {
    setForm({ name: "", email: "", phone: "", type: "Individual", location: "" })
    setError(null)
    setShowModal(true)
  }

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const res = await saveCustomer(businessId, form)
      if (res.success) {
        setShowModal(false)
        router.refresh()
      } else {
        setError(res.error || "Failed to save customer")
      }
    })
  }

  const toggleRow = async (customerId: string) => {
    if (expandedRow === customerId) {
      setExpandedRow(null)
      return
    }
    
    setExpandedRow(customerId)
    if (!historyData[customerId]) {
      setLoadingHistory(prev => ({ ...prev, [customerId]: true }))
      const history = await getCustomerHistory(businessId, customerId)
      setHistoryData(prev => ({ ...prev, [customerId]: history }))
      setLoadingHistory(prev => ({ ...prev, [customerId]: false }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs font-medium text-blue-600 mb-1">Directory</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Customers</h1>
        </div>
        <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2.5 bg-zinc-950 text-white rounded-xl hover:bg-blue-800 transition-all active:scale-[0.98] font-medium text-sm shadow-sm">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-zinc-50 rounded-xl text-blue-600"><Users className="w-5 h-5" /></div>
            <p className="text-sm font-medium text-zinc-500">Total Customers</p>
          </div>
          <p className="text-3xl font-bold text-zinc-950">{totalCustomers}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><UserCheck className="w-5 h-5" /></div>
            <p className="text-sm font-medium text-zinc-500">Active (30d)</p>
          </div>
          <p className="text-3xl font-bold text-zinc-950">{activeCustomers}</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-fuchsia-50 rounded-xl text-fuchsia-600"><UserPlus className="w-5 h-5" /></div>
            <p className="text-sm font-medium text-zinc-500">New This Month</p>
          </div>
          <p className="text-3xl font-bold text-zinc-950">{newThisMonth}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <input 
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-300 rounded-xl focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-950 placeholder-zinc-400 outline-none text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Orders</th>
                <th className="px-6 py-4">Total Spent</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-sm text-zinc-950">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">No customers found</td>
                </tr>
              ) : (
                filtered.map(c => (
                  <React.Fragment key={c.id}>
                    <tr onClick={() => toggleRow(c.id)} className={`hover:bg-white cursor-pointer transition-colors ${expandedRow === c.id ? 'bg-zinc-50/50' : ''}`}>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-zinc-950 flex items-center gap-2">
                          {c.name}
                          {expandedRow === c.id ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                        </p>
                        {c.location && <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {c.location}</p>}
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        {c.email && <p className="text-xs text-zinc-500 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {c.email}</p>}
                        {c.phone && <p className="text-xs text-zinc-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {c.phone}</p>}
                        {!c.email && !c.phone && <span className="text-zinc-400">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 text-blue-600">{c.type}</span>
                      </td>
                      <td className="px-6 py-4 font-medium">{c.totalOrders}</td>
                      <td className="px-6 py-4 font-medium">₹{c.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={(e) => handleEdit(c, e)} className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-zinc-100 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    {expandedRow === c.id && (
                      <tr className="bg-zinc-50/50 border-b border-zinc-200">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="pl-6 border-l-2 border-blue-600/20 py-2">
                            <h4 className="text-sm font-semibold text-zinc-950 flex items-center gap-2 mb-3">
                              <ShoppingBag className="w-4 h-4 text-blue-600" /> Recent Orders
                            </h4>
                            {loadingHistory[c.id] ? (
                              <div className="flex items-center gap-2 text-sm text-zinc-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading history...</div>
                            ) : !historyData[c.id] || historyData[c.id].length === 0 ? (
                              <p className="text-sm text-zinc-500">No orders found for this customer.</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {historyData[c.id].map(order => (
                                  <div key={order.id} className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm text-sm">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="font-medium text-blue-600">{order.order_number}</span>
                                      <span className="text-xs text-zinc-500">{new Date(order.order_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                      <div>
                                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${order.status === 'Completed' ? 'bg-emerald-600/10 text-emerald-700' : 'bg-zinc-200 text-zinc-500'}`}>{order.status}</span>
                                        <p className="text-xs text-zinc-400 mt-1">{order.payment_method}</p>
                                      </div>
                                      <span className="font-semibold text-zinc-950">₹{Number(order.total_amount).toLocaleString()}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <h3 className="text-xl font-semibold text-zinc-950">{form.id ? "Edit Customer" : "New Customer"}</h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-950 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              {error && (
                <div className="p-3 bg-rose-600/10 border border-rose-600/20 rounded-xl text-sm text-rose-800">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-zinc-950 mb-1.5">Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full border border-zinc-300 rounded-xl px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-950"
                  placeholder="Customer Name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-950 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.email || ""}
                    onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full border border-zinc-300 rounded-xl px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-950"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-950 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={form.phone || ""}
                    onChange={e => setForm({...form, phone: e.target.value})}
                    className="w-full border border-zinc-300 rounded-xl px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-950"
                    placeholder="Phone Number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-950 mb-1.5">Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm({...form, type: e.target.value as "Individual" | "Business" | "Wholesale"})}
                  className="w-full border border-zinc-300 rounded-xl px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-950 bg-white"
                >
                  <option value="Individual">Individual</option>
                  <option value="Business">Business</option>
                  <option value="Wholesale">Wholesale</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-950 mb-1.5">Location</label>
                <input
                  type="text"
                  value={form.location || ""}
                  onChange={e => setForm({...form, location: e.target.value})}
                  className="w-full border border-zinc-300 rounded-xl px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-950"
                  placeholder="City, Area, etc."
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-zinc-200 bg-zinc-50/50 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl font-medium text-zinc-500 hover:bg-zinc-100 transition-colors">Cancel</button>
              <button 
                onClick={handleSave}
                disabled={!form.name || isPending}
                className="px-5 py-2.5 rounded-xl font-medium text-white bg-zinc-950 hover:bg-blue-800 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
