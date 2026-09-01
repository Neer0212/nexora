"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PackageOpen, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, Loader2 } from "lucide-react"
import { submitInventoryTransaction, type AdjustmentPayload } from "./actions"

type Transaction = {
  id: string
  transaction_type: string
  quantity: number
  unit_cost: number | null
  reference: string | null
  transaction_date: string
  created_at: string
  product: { id: string; name: string; sku: string | null } | null
  supplier: { id: string; name: string } | null
}

type Product = {
  id: string
  name: string
  stock_quantity: number | null
  low_stock_threshold: number | null
  unit_cost: number | null
}

type Supplier = {
  id: string
  name: string
}

const TYPE_LABELS: Record<string, string> = {
  purchase: "Purchase (Restock)",
  adjustment: "Manual Adjustment",
  return: "Return",
  transfer: "Transfer",
}

export default function InventoryClient({ businessId, transactions, products, suppliers }: {
  businessId: string
  transactions: Transaction[]
  products: Product[]
  suppliers: Supplier[]
}) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    product_id: "",
    supplier_id: "",
    transaction_type: "purchase",
    direction: "add",
    quantity: "",
    unit_cost: "",
    reference: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!formData.product_id) {
      setError("Please select a product.")
      return
    }

    const payload: AdjustmentPayload = {
      product_id: formData.product_id,
      supplier_id: formData.supplier_id || null,
      transaction_type: formData.transaction_type as any,
      quantity: Number(formData.quantity),
      is_negative: formData.direction === "remove",
      unit_cost: formData.unit_cost ? Number(formData.unit_cost) : undefined,
      reference: formData.reference || undefined,
    }

    startTransition(async () => {
      const res = await submitInventoryTransaction(businessId, payload)
      if (res.success) {
        setModalOpen(false)
        setFormData({ product_id: "", supplier_id: "", transaction_type: "purchase", direction: "add", quantity: "", unit_cost: "", reference: "" })
        router.refresh()
      } else {
        setError(res.error || "Failed to record transaction.")
      }
    })
  }

  const getTypeIcon = (type: string, qty: number) => {
    if (qty > 0) return <ArrowUpRight className="w-4 h-4 text-[#3C8F70]" />
    return <ArrowDownRight className="w-4 h-4 text-[#B85454]" />
  }

  // Low-stock products for warning banner
  const lowStockProducts = products.filter(p => 
    p.stock_quantity !== null && p.low_stock_threshold !== null &&
    p.stock_quantity <= p.low_stock_threshold
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#433D8B]">Operations</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#17153B] sm:text-4xl">Inventory Ledger</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#68647A]">View product stock movements and record manual adjustments.</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#17153B] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2E236C] transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Record Movement
        </button>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#C58A3A]/20 bg-[#FDF6EC] p-4">
          <AlertCircle className="h-5 w-5 text-[#C58A3A] shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-[#8B6020] text-sm">
              {lowStockProducts.length} product{lowStockProducts.length > 1 ? "s" : ""} below low-stock threshold
            </p>
            <p className="text-xs text-[#A07A40] mt-1">
              {lowStockProducts.slice(0, 3).map(p => p.name).join(", ")}{lowStockProducts.length > 3 ? ` and ${lowStockProducts.length - 3} more` : ""}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7F5FA] border-b border-[#E7E4EF]">
              <tr>
                <th className="px-6 py-4 font-semibold text-[#68647A]">Date</th>
                <th className="px-6 py-4 font-semibold text-[#68647A]">Product</th>
                <th className="px-6 py-4 font-semibold text-[#68647A]">Type</th>
                <th className="px-6 py-4 font-semibold text-[#68647A]">Supplier</th>
                <th className="px-6 py-4 font-semibold text-[#68647A]">Reference</th>
                <th className="px-6 py-4 font-semibold text-[#68647A] text-right">Qty Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDF5]">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#68647A]">
                    <PackageOpen className="mx-auto h-8 w-8 text-[#C8ACD6] mb-3" />
                    <p className="font-medium text-[#17153B]">No inventory movements found</p>
                  </td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-[#FBFAFD] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-medium text-[#17153B]">{new Date(tx.created_at).toLocaleDateString()}</p>
                      <p className="text-xs text-[#9A94A8]">{new Date(tx.created_at).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-[#17153B]">{tx.product?.name ?? "Unknown"}</p>
                      <p className="text-xs text-[#68647A]">{tx.product?.sku ?? ""}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3F1F6] px-2.5 py-1 text-[11px] font-medium text-[#17153B] capitalize">
                        {getTypeIcon(tx.transaction_type, tx.quantity)}
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#68647A] text-sm">
                      {tx.supplier?.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-[#68647A]">
                      {tx.reference || "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-semibold ${tx.quantity > 0 ? 'text-[#3C8F70]' : 'text-[#B85454]'}`}>
                        {tx.quantity > 0 ? "+" : ""}{tx.quantity}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17153B]/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-[#E7E4EF]">
            <div className="px-6 py-5 border-b border-[#E7E4EF] bg-[#FBFAFD]">
              <h2 className="text-xl font-semibold text-[#17153B]">Record Inventory Movement</h2>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#B85454]/20 bg-[#B85454]/5 p-4 text-sm text-[#8D3F3F]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form id="tx-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#68647A] mb-1.5">Product *</label>
                  <select required value={formData.product_id} onChange={e => {
                    const pid = e.target.value
                    const p = products.find(x => x.id === pid)
                    setFormData(prev => ({ ...prev, product_id: pid, unit_cost: p?.unit_cost?.toString() || "" }))
                  }} className="w-full rounded-xl border border-[#D9D5E4] px-4 py-2.5 text-sm text-[#17153B] outline-none focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B]">
                    <option value="">Select a product...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock: {p.stock_quantity ?? 0}{p.low_stock_threshold !== null && p.stock_quantity !== null && p.stock_quantity <= p.low_stock_threshold ? " ⚠️" : ""})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#68647A] mb-1.5">Type</label>
                    <select value={formData.transaction_type} onChange={e => setFormData(prev => ({ ...prev, transaction_type: e.target.value }))} className="w-full rounded-xl border border-[#D9D5E4] px-4 py-2.5 text-sm text-[#17153B] outline-none focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B]">
                      {Object.entries(TYPE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#68647A] mb-1.5">Direction</label>
                    <select value={formData.direction} onChange={e => setFormData(prev => ({ ...prev, direction: e.target.value }))} className="w-full rounded-xl border border-[#D9D5E4] px-4 py-2.5 text-sm text-[#17153B] outline-none focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B]">
                      <option value="add">Add (+)</option>
                      <option value="remove">Remove (-)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#68647A] mb-1.5">Quantity *</label>
                    <input required type="number" min="0.01" step="0.01" value={formData.quantity} onChange={e => setFormData(prev => ({ ...prev, quantity: e.target.value }))} className="w-full rounded-xl border border-[#D9D5E4] px-4 py-2.5 text-sm text-[#17153B] outline-none focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B]" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#68647A] mb-1.5">Unit Cost</label>
                    <input type="number" min="0" step="0.01" value={formData.unit_cost} onChange={e => setFormData(prev => ({ ...prev, unit_cost: e.target.value }))} className="w-full rounded-xl border border-[#D9D5E4] px-4 py-2.5 text-sm text-[#17153B] outline-none focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B]" placeholder="₹0.00" />
                  </div>
                </div>

                {suppliers.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-[#68647A] mb-1.5">Supplier (Optional)</label>
                    <select value={formData.supplier_id} onChange={e => setFormData(prev => ({ ...prev, supplier_id: e.target.value }))} className="w-full rounded-xl border border-[#D9D5E4] px-4 py-2.5 text-sm text-[#17153B] outline-none focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B]">
                      <option value="">No supplier</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-[#68647A] mb-1.5">Reference (Invoice / Reason)</label>
                  <input type="text" value={formData.reference} onChange={e => setFormData(prev => ({ ...prev, reference: e.target.value }))} className="w-full rounded-xl border border-[#D9D5E4] px-4 py-2.5 text-sm text-[#17153B] outline-none focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B]" placeholder="e.g. PO-2023, Damaged goods" />
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-[#E7E4EF] bg-[#FBFAFD] flex justify-end gap-3">
              <button type="button" onClick={() => setModalOpen(false)} disabled={isPending} className="px-5 py-2.5 text-sm font-medium text-[#68647A] bg-white border border-[#D9D5E4] rounded-xl hover:bg-[#F3F1F6] transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" form="tx-form" disabled={isPending} className="inline-flex items-center justify-center min-w-[100px] px-5 py-2.5 text-sm font-medium text-white bg-[#17153B] rounded-xl hover:bg-[#2E236C] transition-colors disabled:opacity-50 shadow-sm">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
