"use client"

import { useState, useEffect, useTransition } from "react"
import { X, Loader2, AlertCircle } from "lucide-react"
import { saveProduct } from "./actions"

type ProductModalProps = {
  isOpen: boolean
  onClose: () => void
  businessId: string
  product: any | null
  onSuccess: () => void
}

export default function ProductModal({ isOpen, onClose, businessId, product, onSuccess }: ProductModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "", sku: "", barcode: "", category: "", brand: "", unit: "",
    unit_cost: "", selling_price: "", tax_rate: "0", stock_quantity: "0", low_stock_threshold: "0"
  })

  useEffect(() => {
    if (isOpen) {
      setError(null)
      if (product) {
        setFormData({
          name: product.name || "",
          sku: product.sku || "",
          barcode: product.barcode || "",
          category: product.category || "",
          brand: product.brand || "",
          unit: product.unit || "",
          unit_cost: product.unit_cost?.toString() || "",
          selling_price: product.selling_price?.toString() || "",
          tax_rate: product.tax_rate?.toString() || "0",
          stock_quantity: product.stock_quantity?.toString() || "0",
          low_stock_threshold: product.low_stock_threshold?.toString() || "0",
        })
      } else {
        setFormData({
          name: "", sku: "", barcode: "", category: "", brand: "", unit: "piece",
          unit_cost: "", selling_price: "", tax_rate: "0", stock_quantity: "0", low_stock_threshold: "0"
        })
      }
    }
  }, [isOpen, product])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const values = {
      id: product?.id,
      name: formData.name,
      sku: formData.sku || null,
      barcode: formData.barcode || null,
      category: formData.category || null,
      brand: formData.brand || null,
      unit: formData.unit || null,
      unit_cost: formData.unit_cost ? Number(formData.unit_cost) : null,
      selling_price: Number(formData.selling_price),
      tax_rate: formData.tax_rate ? Number(formData.tax_rate) : 0,
      stock_quantity: formData.stock_quantity ? Number(formData.stock_quantity) : 0,
      low_stock_threshold: formData.low_stock_threshold ? Number(formData.low_stock_threshold) : 0,
      active: product ? product.active : true,
    }

    startTransition(async () => {
      const res = await saveProduct(businessId, values)
      if (res.success) {
        onSuccess()
      } else {
        setError(res.error || "Failed to save product.")
      }
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17153B]/20 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-[#E7E4EF]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E7E4EF] bg-[#FBFAFD]">
          <h2 className="text-xl font-semibold text-[#17153B]">{product ? "Edit Product" : "New Product"}</h2>
          <button onClick={onClose} className="p-2 text-[#9A94A8] hover:bg-[#E7E4EF] rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#B85454]/20 bg-[#B85454]/5 p-4 text-sm text-[#8D3F3F]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#68647A]">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#68647A] mb-1.5">Product Name *</label>
                  <input required name="name" value={formData.name} onChange={handleChange} className="w-full rounded-xl border border-[#D9D5E4] px-4 py-2.5 text-sm text-[#17153B] outline-none focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B]" placeholder="e.g. Premium Coffee Beans" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#68647A] mb-1.5">SKU</label>
                  <input name="sku" value={formData.sku} onChange={handleChange} className="w-full rounded-xl border border-[#D9D5E4] px-4 py-2.5 text-sm text-[#17153B] outline-none focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B]" placeholder="COF-PR-01" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#68647A] mb-1.5">Barcode</label>
                  <input name="barcode" value={formData.barcode} onChange={handleChange} className="w-full rounded-xl border border-[#D9D5E4] px-4 py-2.5 text-sm text-[#17153B] outline-none focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B]" placeholder="Scan or enter barcode" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#68647A] mb-1.5">Category</label>
                  <input name="category" value={formData.category} onChange={handleChange} className="w-full rounded-xl border border-[#D9D5E4] px-4 py-2.5 text-sm text-[#17153B] outline-none focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B]" placeholder="Beverages" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#68647A] mb-1.5">Brand</label>
                  <input name="brand" value={formData.brand} onChange={handleChange} className="w-full rounded-xl border border-[#D9D5E4] px-4 py-2.5 text-sm text-[#17153B] outline-none focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B]" placeholder="Nexora Roasters" />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-[#E7E4EF]">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#68647A]">Pricing & Tax</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#68647A] mb-1.5">Selling Price *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A94A8] text-sm">₹</span>
                    <input required type="number" step="0.01" min="0" name="selling_price" value={formData.selling_price} onChange={handleChange} className="w-full rounded-xl border border-[#D9D5E4] pl-7 pr-4 py-2.5 text-sm text-[#17153B] outline-none focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B]" placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#68647A] mb-1.5">Cost Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A94A8] text-sm">₹</span>
                    <input type="number" step="0.01" min="0" name="unit_cost" value={formData.unit_cost} onChange={handleChange} className="w-full rounded-xl border border-[#D9D5E4] pl-7 pr-4 py-2.5 text-sm text-[#17153B] outline-none focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B]" placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#68647A] mb-1.5">Tax Rate (%)</label>
                  <input type="number" step="0.01" min="0" max="100" name="tax_rate" value={formData.tax_rate} onChange={handleChange} className="w-full rounded-xl border border-[#D9D5E4] px-4 py-2.5 text-sm text-[#17153B] outline-none focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B]" placeholder="18" />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-[#E7E4EF]">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#68647A]">Inventory</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#68647A] mb-1.5">Current Stock</label>
                  <input type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} className="w-full rounded-xl border border-[#D9D5E4] px-4 py-2.5 text-sm text-[#17153B] outline-none focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#68647A] mb-1.5">Low Stock Alert</label>
                  <input type="number" name="low_stock_threshold" value={formData.low_stock_threshold} onChange={handleChange} className="w-full rounded-xl border border-[#D9D5E4] px-4 py-2.5 text-sm text-[#17153B] outline-none focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#68647A] mb-1.5">Unit</label>
                  <input name="unit" value={formData.unit} onChange={handleChange} className="w-full rounded-xl border border-[#D9D5E4] px-4 py-2.5 text-sm text-[#17153B] outline-none focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B]" placeholder="piece, kg, box" />
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-[#E7E4EF] bg-[#FBFAFD] flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={isPending} className="px-5 py-2.5 text-sm font-medium text-[#68647A] bg-white border border-[#D9D5E4] rounded-xl hover:bg-[#F3F1F6] transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" form="product-form" disabled={isPending} className="inline-flex items-center justify-center min-w-[100px] px-5 py-2.5 text-sm font-medium text-white bg-[#17153B] rounded-xl hover:bg-[#2E236C] transition-colors disabled:opacity-50 shadow-sm">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Product"}
          </button>
        </div>
      </div>
    </div>
  )
}
