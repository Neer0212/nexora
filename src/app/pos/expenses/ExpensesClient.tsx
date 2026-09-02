"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Filter, Pencil, Trash2, IndianRupee, PieChart, Activity, X } from "lucide-react"
import { saveExpense, deleteExpense } from "./actions"

type Supplier = {
  id: string
  name: string
}

type Expense = {
  id: string
  category: string
  description: string
  amount: number
  expense_date: string
  supplier_id: string | null
  supplier: { id: string, name: string } | null
  payment_method: string | null
  payment_status: string | null
  tax_amount: number
  reference_number: string | null
}

export default function ExpensesClient({ 
  businessId, 
  expenses, 
  suppliers 
}: { 
  businessId: string
  expenses: Expense[]
  suppliers: Supplier[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    category: "Other",
    description: "",
    amount: 0,
    expense_date: new Date().toISOString().split("T")[0],
    supplier_id: "",
    payment_method: "Cash",
    payment_status: "Paid",
    tax_amount: 0,
    reference_number: ""
  })

  const CATEGORIES = [
    'Rent', 'Utilities', 'Salary', 'Marketing', 'Transport', 
    'Supplies', 'Packaging', 'Maintenance', 'Insurance', 'Other'
  ]

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const thisMonthExpenses = expenses.filter(e => {
    const d = new Date(e.expense_date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const totalThisMonth = thisMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0)
  
  const categoryTotals = thisMonthExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + Number(e.amount)
    return acc
  }, {} as Record<string, number>)

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "None"
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const currentDay = new Date().getDate()
  const averagePerDay = currentDay > 0 ? totalThisMonth / currentDay : 0

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.description?.toLowerCase().includes(search.toLowerCase()) || 
                          e.category.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === "All" || e.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleOpenModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense)
      setFormData({
        category: expense.category,
        description: expense.description || "",
        amount: expense.amount,
        expense_date: expense.expense_date,
        supplier_id: expense.supplier_id || "",
        payment_method: expense.payment_method || "",
        payment_status: expense.payment_status || "Pending",
        tax_amount: expense.tax_amount || 0,
        reference_number: expense.reference_number || ""
      })
    } else {
      setEditingExpense(null)
      setFormData({
        category: "Other",
        description: "",
        amount: 0,
        expense_date: new Date().toISOString().split("T")[0],
        supplier_id: "",
        payment_method: "Cash",
        payment_status: "Paid",
        tax_amount: 0,
        reference_number: ""
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await saveExpense(businessId, {
        id: editingExpense?.id,
        category: formData.category as any,
        description: formData.description,
        amount: Number(formData.amount),
        expense_date: formData.expense_date,
        supplier_id: formData.supplier_id || undefined,
        payment_method: formData.payment_method,
        payment_status: formData.payment_status,
        tax_amount: Number(formData.tax_amount),
        reference_number: formData.reference_number
      })
      setIsModalOpen(false)
      router.refresh()
    } catch (error) {
      console.error(error)
      alert("Failed to save expense")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return
    setIsDeleting(id)
    try {
      await deleteExpense(businessId, id)
      router.refresh()
    } catch (error) {
      console.error(error)
      alert("Failed to delete expense")
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#17153B] sm:text-4xl">Expenses</h1>
          <p className="text-[#68647A] mt-1">Manage your business expenses and tracking</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#17153B] text-white px-4 py-2.5 rounded-xl hover:bg-[#2E236C] transition-colors active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          <span>Add Expense</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-[#E7E4EF] p-6 shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#F1F0F8] rounded-xl text-[#433D8B]">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#433D8B]">This Month</p>
              <h3 className="text-2xl font-semibold text-[#17153B]">₹{totalThisMonth.toFixed(2)}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-3xl border border-[#E7E4EF] p-6 shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#F1F0F8] rounded-xl text-[#433D8B]">
              <PieChart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#433D8B]">Top Category</p>
              <h3 className="text-2xl font-semibold text-[#17153B]">{topCategory}</h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#E7E4EF] p-6 shadow-[0_12px_35px_rgba(23,21,59,0.04)]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#F1F0F8] rounded-xl text-[#433D8B]">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#433D8B]">Avg. Per Day</p>
              <h3 className="text-2xl font-semibold text-[#17153B]">₹{averagePerDay.toFixed(2)}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)] overflow-hidden">
        <div className="p-4 border-b border-[#E7E4EF] flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9A94A8]" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#D9D5E4] rounded-xl focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none"
            />
          </div>
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none w-full sm:w-48 pl-10 pr-8 py-2 border border-[#D9D5E4] rounded-xl focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none bg-white"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9A94A8]" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F5FA] border-b border-[#E7E4EF]">
                <th className="px-6 py-4 font-semibold text-[#68647A] text-sm">Date</th>
                <th className="px-6 py-4 font-semibold text-[#68647A] text-sm">Category</th>
                <th className="px-6 py-4 font-semibold text-[#68647A] text-sm">Description</th>
                <th className="px-6 py-4 font-semibold text-[#68647A] text-sm">Amount</th>
                <th className="px-6 py-4 font-semibold text-[#68647A] text-sm">Payment</th>
                <th className="px-6 py-4 font-semibold text-[#68647A] text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#9A94A8]">
                    No expenses found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-[#E7E4EF] last:border-0 hover:bg-[#F7F5FA]/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-[#17153B]">
                      {new Date(expense.expense_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#F1F0F8] text-[#433D8B]">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#17153B] max-w-xs truncate">
                      {expense.description || "-"}
                      {expense.supplier && (
                        <div className="text-xs text-[#68647A] mt-0.5">
                          Supplier: {expense.supplier.name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[#17153B]">
                      ₹{Number(expense.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[#17153B]">{expense.payment_method || "-"}</span>
                        {expense.payment_status === "Paid" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#3C8F70]/10 text-[#3C8F70]">
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#C58A3A]/10 text-[#C58A3A]">
                            {expense.payment_status}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(expense)}
                          className="p-1.5 text-[#68647A] hover:bg-[#F1F0F8] hover:text-[#433D8B] rounded-lg transition-colors"
                        >
                          <span title="Edit"><Pencil className="w-4 h-4" /></span>
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          disabled={isDeleting === expense.id}
                          className="p-1.5 text-[#68647A] hover:bg-[#B85454]/10 hover:text-[#B85454] rounded-lg transition-colors disabled:opacity-50"
                        >
                          <span title="Delete"><Trash2 className="w-4 h-4" /></span>
                        </button>
                      </div>
                    </td>
                  </tr>
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
                {editingExpense ? 'Edit Expense' : 'Add Expense'}
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
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-[#17153B] mb-1.5">Amount (₹)*</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2.5 border border-[#D9D5E4] rounded-xl focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none transition-shadow"
                  />
                </div>
                
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-[#17153B] mb-1.5">Date*</label>
                  <input
                    type="date"
                    required
                    value={formData.expense_date}
                    onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                    className="w-full px-4 py-2.5 border border-[#D9D5E4] rounded-xl focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none transition-shadow"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-[#17153B] mb-1.5">Category*</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2.5 border border-[#D9D5E4] rounded-xl focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none transition-shadow bg-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-[#17153B] mb-1.5">Supplier</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
                    className="w-full px-4 py-2.5 border border-[#D9D5E4] rounded-xl focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none transition-shadow bg-white"
                  >
                    <option value="">None</option>
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-[#17153B] mb-1.5">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2.5 border border-[#D9D5E4] rounded-xl focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none transition-shadow"
                    placeholder="Brief description of the expense..."
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-[#17153B] mb-1.5">Payment Method</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                    className="w-full px-4 py-2.5 border border-[#D9D5E4] rounded-xl focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none transition-shadow bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-[#17153B] mb-1.5">Payment Status</label>
                  <select
                    value={formData.payment_status}
                    onChange={(e) => setFormData({...formData, payment_status: e.target.value})}
                    className="w-full px-4 py-2.5 border border-[#D9D5E4] rounded-xl focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none transition-shadow bg-white"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
                
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-[#17153B] mb-1.5">Tax Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.tax_amount || ''}
                    onChange={(e) => setFormData({...formData, tax_amount: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-2.5 border border-[#D9D5E4] rounded-xl focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none transition-shadow"
                  />
                </div>
                
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-medium text-[#17153B] mb-1.5">Reference Number</label>
                  <input
                    type="text"
                    value={formData.reference_number}
                    onChange={(e) => setFormData({...formData, reference_number: e.target.value})}
                    className="w-full px-4 py-2.5 border border-[#D9D5E4] rounded-xl focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] outline-none transition-shadow"
                    placeholder="Invoice or receipt number"
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
                  {isLoading ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
