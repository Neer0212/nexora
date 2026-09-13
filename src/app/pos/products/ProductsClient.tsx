"use client"

import { useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Plus, Archive, Edit2, ArchiveRestore, Package, AlertCircle } from "lucide-react"
import { toggleProductActive } from "./actions"
import ProductModal from "./ProductModal"

type Product = {
  id: string
  name: string
  sku: string | null
  barcode: string | null
  category: string | null
  brand: string | null
  unit: string | null
  unit_cost: number | null
  selling_price: number | null
  tax_rate: number | null
  stock_quantity: number | null
  low_stock_threshold: number | null
  active: boolean
}

export default function ProductsClient({ businessId, initialProducts }: { businessId: string, initialProducts: Product[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [search, setSearch] = useState("")
  const [showInactive, setShowInactive] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [prefillBarcode, setPrefillBarcode] = useState<string | null>(null)

  const barcodeParam = searchParams.get("barcode")
  const [prevBarcodeParam, setPrevBarcodeParam] = useState(barcodeParam)

  if (barcodeParam !== prevBarcodeParam) {
    setPrevBarcodeParam(barcodeParam)
    if (barcodeParam) {
      setPrefillBarcode(barcodeParam)
      setEditingProduct(null)
      setModalOpen(true)
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search)) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
      const matchActive = showInactive ? true : p.active
      return matchSearch && matchActive
    })
  }, [products, search, showInactive])

  const handleEdit = (p: Product) => {
    setPrefillBarcode(null)
    setEditingProduct(p)
    setModalOpen(true)
  }

  const handleAdd = () => {
    setPrefillBarcode(null)
    setEditingProduct(null)
    setModalOpen(true)
  }

  const handleToggleActive = async (id: string, active: boolean) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, active } : p))
    await toggleProductActive(businessId, id, active)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-blue-600">Operations</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Product Catalogue</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">Manage your POS products, barcodes, and inventory levels.</p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, SKU, or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-transparent border-none focus:ring-0 text-sm text-zinc-950 placeholder-zinc-400 outline-none"
          />
        </div>
        <label className="flex items-center gap-2 pr-4 text-sm font-medium text-zinc-500 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-zinc-300 text-blue-600 focus:ring-blue-600"
          />
          Show archived
        </label>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-zinc-500">Product Name</th>
                <th className="px-6 py-4 font-semibold text-zinc-500">SKU / Barcode</th>
                <th className="px-6 py-4 font-semibold text-zinc-500">Category</th>
                <th className="px-6 py-4 font-semibold text-zinc-500 text-right">Price</th>
                <th className="px-6 py-4 font-semibold text-zinc-500 text-right">Stock</th>
                <th className="px-6 py-4 font-semibold text-zinc-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    <Package className="mx-auto h-8 w-8 text-zinc-300 mb-3" />
                    <p className="font-medium text-zinc-950">No products found</p>
                    <p className="text-xs mt-1">Try adjusting your search or add a new product.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => (
                  <tr key={p.id} className={`hover:bg-zinc-50/50 transition-colors ${!p.active ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-950">{p.name}</p>
                      {p.brand && <p className="text-xs text-zinc-400">{p.brand}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        {p.sku && <p className="text-zinc-500">SKU: {p.sku}</p>}
                        {p.barcode && <p className="text-zinc-400 font-mono">{p.barcode}</p>}
                        {!p.sku && !p.barcode && <span className="text-zinc-400">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {p.category
                        ? <span className="inline-flex rounded-md bg-zinc-100 border border-zinc-200 px-2 py-0.5 text-[11px] font-medium text-zinc-600">{p.category}</span>
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-medium text-zinc-950">₹{Number(p.selling_price).toLocaleString()}</p>
                      {p.unit_cost && <p className="text-xs text-zinc-400">Cost: ₹{Number(p.unit_cost).toLocaleString()}</p>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.stock_quantity !== null && p.low_stock_threshold !== null && p.stock_quantity <= p.low_stock_threshold && (
                          <span title="Low stock"><AlertCircle className="w-3.5 h-3.5 text-amber-500" /></span>
                        )}
                        <span className={`font-medium ${p.stock_quantity !== null && p.stock_quantity <= 0 ? 'text-rose-600' : 'text-zinc-950'}`}>
                          {p.stock_quantity ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(p)} className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-zinc-100 rounded-md transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {p.active ? (
                          <button onClick={() => handleToggleActive(p.id, false)} className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Archive">
                            <Archive className="w-4 h-4" />
                          </button>
                        ) : (
                          <button onClick={() => handleToggleActive(p.id, true)} className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" title="Restore">
                            <ArchiveRestore className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setPrefillBarcode(null) }}
        businessId={businessId}
        product={editingProduct}
        prefillBarcode={prefillBarcode}
        onSuccess={() => {
          setModalOpen(false)
          if (prefillBarcode) {
            setPrefillBarcode(null)
            router.push("/pos")
          } else {
            router.refresh()
          }
        }}
      />
    </div>
  )
}
