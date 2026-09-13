"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PackageOpen, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, Loader2 } from "lucide-react"
import { submitInventoryTransaction, type AdjustmentPayload } from "./actions"

export type Transaction = {
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
      transaction_type: formData.transaction_type as "purchase" | "adjustment" | "return" | "transfer",
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
    if (qty > 0) return <ArrowUpRight className="w-4 h-4 text-emerald-600" />
    return <ArrowDownRight className="w-4 h-4 text-rose-600" />
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
          <p className="text-xs font-medium text-blue-600">Operations</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Inventory Ledger</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">View product stock movements and record manual adjustments.</p>
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Record Movement
        </button>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-[#FDF6EC] p-4">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
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

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-zinc-500">Date</th>
                <th className="px-6 py-4 font-semibold text-zinc-500">Product</th>
                <th className="px-6 py-4 font-semibold text-zinc-500">Type</th>
                <th className="px-6 py-4 font-semibold text-zinc-500">Supplier</th>
                <th className="px-6 py-4 font-semibold text-zinc-500">Reference</th>
                <th className="px-6 py-4 font-semibold text-zinc-500 text-right">Qty Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    <PackageOpen className="mx-auto h-8 w-8 text-blue-200 mb-3" />
                    <p className="font-medium text-zinc-950">No inventory movements found</p>
                  </td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-medium text-zinc-950">{new Date(tx.created_at).toLocaleDateString()}</p>
                      <p className="text-xs text-zinc-400">{new Date(tx.created_at).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-950">{tx.product?.name ?? "Unknown"}</p>
                      <p className="text-xs text-zinc-500">{tx.product?.sku ?? ""}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-950 capitalize">
                        {getTypeIcon(tx.transaction_type, tx.quantity)}
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 text-sm">
                      {tx.supplier?.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {tx.reference || "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-semibold ${tx.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/20 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-zinc-200">
            <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50/50">
              <h2 className="text-xl font-semibold text-zinc-950">Record Inventory Movement</h2>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-600/20 bg-rose-600/5 p-4 text-sm text-rose-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form id="tx-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Product *</label>
                  <select required value={formData.product_id} onChange={e => {
                    const pid = e.target.value
                    const p = products.find(x => x.id === pid)
                    setFormData(prev => ({ ...prev, product_id: pid, unit_cost: p?.unit_cost?.toString() || "" }))
                  }} className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm text-zinc-950 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600">
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
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Type</label>
                    <select value={formData.transaction_type} onChange={e => setFormData(prev => ({ ...prev, transaction_type: e.target.value }))} className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm text-zinc-950 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600">
                      {Object.entries(TYPE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Direction</label>
                    <select value={formData.direction} onChange={e => setFormData(prev => ({ ...prev, direction: e.target.value }))} className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm text-zinc-950 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600">
                      <option value="add">Add (+)</option>
                      <option value="remove">Remove (-)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Quantity *</label>
                    <input required type="number" min="0.01" step="0.01" value={formData.quantity} onChange={e => setFormData(prev => ({ ...prev, quantity: e.target.value }))} className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm text-zinc-950 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Unit Cost</label>
                    <input type="number" min="0" step="0.01" value={formData.unit_cost} onChange={e => setFormData(prev => ({ ...prev, unit_cost: e.target.value }))} className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm text-zinc-950 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" placeholder="₹0.00" />
                  </div>
                </div>

                {suppliers.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1.5">Supplier (Optional)</label>
                    <select value={formData.supplier_id} onChange={e => setFormData(prev => ({ ...prev, supplier_id: e.target.value }))} className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm text-zinc-950 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600">
                      <option value="">No supplier</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1.5">Reference (Invoice / Reason)</label>
                  <input type="text" value={formData.reference} onChange={e => setFormData(prev => ({ ...prev, reference: e.target.value }))} className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm text-zinc-950 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600" placeholder="e.g. PO-2023, Damaged goods" />
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-zinc-200 bg-zinc-50/50 flex justify-end gap-3">
              <button type="button" onClick={() => setModalOpen(false)} disabled={isPending} className="px-5 py-2.5 text-sm font-medium text-zinc-500 bg-white border border-zinc-300 rounded-xl hover:bg-zinc-100 transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" form="tx-form" disabled={isPending} className="inline-flex items-center justify-center min-w-[100px] px-5 py-2.5 text-sm font-medium text-white bg-zinc-950 rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50 shadow-sm">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
