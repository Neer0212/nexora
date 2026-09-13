"use client"

import { useState, useRef, useEffect, useMemo, useTransition } from "react"
import { Search, Plus, Minus, X, CreditCard, Banknote, UserPlus, Package, Loader2, AlertCircle, Receipt, ShoppingBag, Tag, ExternalLink } from "lucide-react"
import { getPOSProducts, processCheckout, quickCreateCustomer, type CheckoutPayload } from "./actions"
import { calculateCartTotals } from "@/lib/cart"

type Product = {
  id: string
  name: string
  sku: string | null
  barcode: string | null
  selling_price: number | null
  unit_cost: number | null
  tax_rate: number | null
  stock_quantity: number | null
  low_stock_threshold: number | null
}

type Customer = {
  id: string
  name: string
  email: string | null
  phone: string | null
}

type CartItem = {
  cartId: string
  product: Product
  quantity: number
  customPrice: number // always set to selling_price on add
}

// Quick-create prompt shown when barcode scan finds nothing
type UnknownBarcode = {
  code: string
}

export default function POSClient({ businessId, initialProducts, customers }: { businessId: string, initialProducts: Product[], customers: Customer[] }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState("")
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [discount, setDiscount] = useState<number>(0)
  const [, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successOrder, setSuccessOrder] = useState<string | null>(null)
  const [unknownBarcode, setUnknownBarcode] = useState<UnknownBarcode | null>(null)
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState("")
  const [newCustomerPhone, setNewCustomerPhone] = useState("")
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)
  const [localCustomers, setLocalCustomers] = useState<Customer[]>(customers)

  const barcodeInputRef = useRef<HTMLInputElement>(null)

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { cartId: Math.random().toString(36).substring(2, 9), product, quantity: 1, customPrice: product.selling_price ?? 0 }]
    })
    setSuccessOrder(null)
  }

  const handleBarcodeScan = async (code: string) => {
    const match = products.find(p => p.barcode === code)
    if (match) {
      addToCart(match)
      return
    }

    const remote = await getPOSProducts(businessId, code)
    if (remote.length === 1) {
      addToCart(remote[0])
      if (!products.some(p => p.id === remote[0].id)) {
        setProducts(prev => [remote[0], ...prev])
      }
    } else {
      // Unknown barcode — prompt quick-create
      setUnknownBarcode({ code })
    }
  }

  // Barcode scanner keyboard listener
  useEffect(() => {
    let buffer = ""
    let lastTime = Date.now()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Enter' && e.target === barcodeInputRef.current) {
          const code = barcodeInputRef.current.value
          if (code) handleBarcodeScan(code)
          barcodeInputRef.current.value = ""
        }
        return
      }

      const currentTime = Date.now()
      if (currentTime - lastTime > 50) buffer = ""
      
      if (e.key !== 'Enter' && e.key.length === 1) {
        buffer += e.key
      } else if (e.key === 'Enter' && buffer.length > 3) {
        handleBarcodeScan(buffer)
        buffer = ""
      }
      
      lastTime = currentTime
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, businessId])

  useEffect(() => {
    if (search.trim().length > 2) {
      const timer = setTimeout(async () => {
        const results = await getPOSProducts(businessId, search)
        setProducts(results)
      }, 300)
      return () => clearTimeout(timer)
    } else if (search.trim() === "") {
      const timer = setTimeout(() => setProducts(initialProducts), 0)
      return () => clearTimeout(timer)
    }
  }, [search, businessId, initialProducts])



  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQ = item.quantity + delta
        return newQ > 0 ? { ...item, quantity: newQ } : item
      }
      return item
    }))
  }

  const updateCustomPrice = (cartId: string, price: number) => {
    setCart(prev => prev.map(item => item.cartId === cartId ? { ...item, customPrice: price } : item))
  }

  const removeCartItem = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId))
  }

  // Oversell check: items where quantity requested > stock
  const oversellItems = cart.filter(item => 
    item.product.stock_quantity !== null && item.quantity > item.product.stock_quantity
  )

  const totals = useMemo(() => {
    return calculateCartTotals(cart, discount)
  }, [cart, discount])

  const handleCheckout = (paymentMethod: string) => {
    if (cart.length === 0) return
    if (oversellItems.length > 0) {
      setError(`Cannot checkout: insufficient stock for ${oversellItems.map(i => i.product.name).join(", ")}`)
      return
    }

    setBusy(true)
    setError(null)
    setSuccessOrder(null)

    const payload: CheckoutPayload = {
      customer_id: selectedCustomer || null,
      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.tax,
      total: totals.total,
      payment_method: paymentMethod,
      items: cart.map(item => {
        const price = item.customPrice
        const lineTotal = price * item.quantity
        const taxRate = item.product.tax_rate ?? 0
        const lineTax = lineTotal * (taxRate / 100)
        return {
          product_id: item.product.id,
          name: item.product.name,
          sku: item.product.sku,
          barcode: item.product.barcode,
          quantity: item.quantity,
          price,
          cost: item.product.unit_cost ?? 0,
          discount: 0,
          tax: lineTax,
          total: lineTotal + lineTax
        }
      })
    }

    startTransition(async () => {
      const res = await processCheckout(businessId, payload)
      if (res.success) {
        setCart([])
        setSelectedCustomer(null)
        setDiscount(0)
        setSuccessOrder(res.orderNumber!)
      } else {
        setError(res.error || "Checkout failed")
      }
      setBusy(false)
    })
  }

  const handleCreateCustomer = async () => {
    if (!newCustomerName) return
    setIsCreatingCustomer(true)
    const res = await quickCreateCustomer(businessId, newCustomerName, newCustomerPhone)
    if (res.success && res.customer) {
      setLocalCustomers(prev => [...prev, { id: res.customer.id, name: res.customer.name, email: null, phone: res.customer.phone }])
      setSelectedCustomer(res.customer.id)
      setShowNewCustomer(false)
      setNewCustomerName("")
      setNewCustomerPhone("")
    } else {
      setError(res.error || "Failed to create customer")
    }
    setIsCreatingCustomer(false)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Left Pane: Products */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <input 
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan barcode or search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-300 rounded-xl focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-950 placeholder-zinc-400 outline-none transition-shadow"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-rose-600/20 bg-rose-600/5 p-3 text-sm text-rose-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
            </div>
          )}

          {/* Unknown barcode prompt */}
          {unknownBarcode && (
            <div className="mb-4 rounded-xl border border-blue-600/20 bg-zinc-100 p-4">
              <p className="text-sm font-medium text-zinc-950">Barcode not found: <code className="bg-white px-1.5 py-0.5 rounded text-blue-600 font-mono">{unknownBarcode.code}</code></p>
              <p className="text-xs text-zinc-500 mt-1">This barcode doesn&apos;t match any existing product.</p>
              <div className="flex gap-2 mt-3">
                <a 
                  href={`/pos/products?barcode=${encodeURIComponent(unknownBarcode.code)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-800 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" /> Create Product
                </a>
                <button onClick={() => setUnknownBarcode(null)} className="px-3 py-1.5 text-xs font-medium text-zinc-500 bg-white rounded-lg border border-zinc-300 hover:bg-zinc-100">
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {successOrder && (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-600/20 bg-emerald-600/5 p-4 text-sm text-emerald-700">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Receipt className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-950">Checkout Successful</p>
                  <p>Order {successOrder} recorded and inventory updated.</p>
                </div>
              </div>
              <button onClick={() => setSuccessOrder(null)}><X className="h-4 w-4" /></button>
            </div>
          )}

          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
              <Package className="h-12 w-12 text-blue-200" />
              <p>No products found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(p => {
                const isOutOfStock = p.stock_quantity !== null && p.stock_quantity <= 0
                const isLowStock = !isOutOfStock && p.stock_quantity !== null && p.low_stock_threshold !== null && p.stock_quantity <= p.low_stock_threshold
                return (
                  <button 
                    key={p.id} 
                    onClick={() => addToCart(p)}
                    disabled={isOutOfStock}
                    className={`flex flex-col text-left rounded-2xl p-4 transition-all active:scale-[0.98] border ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-zinc-50 border-zinc-200' : 'bg-white border-zinc-200 hover:border-blue-600 hover:shadow-sm'}`}
                  >
                    <span className="font-semibold text-zinc-950 line-clamp-2 leading-tight mb-2">{p.name}</span>
                    <div className="mt-auto flex items-end justify-between w-full">
                      <span className="font-medium text-blue-600">₹{Number(p.selling_price).toLocaleString()}</span>
                      <span className={`text-[10px] uppercase font-bold tracking-wider ${isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-500' : 'text-zinc-400'}`}>
                        {isOutOfStock ? "Out of stock" : `${p.stock_quantity} left`}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Cart */}
      <div className="w-full lg:w-[400px] xl:w-[480px] flex flex-col bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden shrink-0">
        <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-950 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" /> Current Cart
          </h2>
          <button onClick={() => setCart([])} disabled={cart.length === 0} className="text-xs font-medium text-zinc-500 hover:text-rose-600 disabled:opacity-50 transition-colors">
            Clear
          </button>
        </div>

        <div className="p-4 border-b border-zinc-200">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={selectedCustomer || ""}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full appearance-none rounded-xl border border-zinc-300 bg-white pl-4 pr-10 py-2.5 text-sm text-zinc-950 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              >
                <option value="">Walk-in Customer</option>
                {localCustomers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</option>
                ))}
              </select>
              <UserPlus className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
            </div>
            <button
              onClick={() => setShowNewCustomer(true)}
              className="px-3 rounded-xl border border-zinc-300 bg-white text-blue-600 hover:bg-zinc-50 hover:border-blue-600 transition-colors flex items-center justify-center"
              title="New Customer"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Oversell warning */}
        {oversellItems.length > 0 && (
          <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-[#FDF6EC] p-3 text-xs text-[#8B6020]">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
            Insufficient stock: {oversellItems.map(i => i.product.name).join(", ")}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-zinc-400">
              Cart is empty. Scan or select items.
            </div>
          ) : (
            cart.map(item => {
              const isOverSell = item.product.stock_quantity !== null && item.quantity > item.product.stock_quantity
              const lineTotal = item.customPrice * item.quantity
              return (
                <div key={item.cartId} className={`bg-[#FBFBFC] p-3 rounded-xl border ${isOverSell ? 'border-amber-500/30 bg-[#FDF6EC]' : 'border-zinc-100'}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-zinc-950 text-sm truncate">{item.product.name}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded-lg border border-zinc-200 p-1 shadow-sm">
                      <button onClick={() => updateQuantity(item.cartId, -1)} className="p-1 hover:bg-zinc-100 rounded text-zinc-500"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="w-6 text-center text-sm font-medium text-zinc-950">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cartId, 1)} className="p-1 hover:bg-zinc-100 rounded text-zinc-500"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="text-right min-w-[70px]">
                      <p className="font-medium text-zinc-950 text-sm">₹{lineTotal.toLocaleString()}</p>
                    </div>
                    <button onClick={() => removeCartItem(item.cartId)} className="p-1.5 text-zinc-300 hover:text-rose-600 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                  {/* Custom price override */}
                  <div className="mt-2 flex items-center gap-2">
                    <Tag className="w-3 h-3 text-zinc-400 shrink-0" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.customPrice}
                      onChange={e => updateCustomPrice(item.cartId, Number(e.target.value))}
                      className="w-24 text-xs px-2 py-1 border border-zinc-300 rounded-lg outline-none focus:border-blue-600 text-zinc-950"
                      title="Override unit price"
                    />
                    <span className="text-xs text-zinc-400">unit price</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="p-5 border-t border-zinc-200 bg-zinc-50/50 space-y-3">
          <div className="flex justify-between text-sm text-zinc-500">
            <span>Subtotal</span>
            <span>₹{totals.subtotal.toLocaleString()}</span>
          </div>
          {totals.tax > 0 && (
            <div className="flex justify-between text-sm text-zinc-500">
              <span>Tax</span>
              <span>₹{totals.tax.toLocaleString()}</span>
            </div>
          )}
          {/* Discount input */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Discount</span>
            <div className="flex items-center gap-1">
              <span className="text-zinc-500">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discount || ""}
                onChange={e => setDiscount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-20 text-right text-sm px-2 py-0.5 border border-zinc-300 rounded-lg outline-none focus:border-blue-600 text-zinc-950"
              />
            </div>
          </div>

          <div className="flex justify-between text-xl font-bold text-zinc-950 pt-2 border-t border-zinc-200">
            <span>Total</span>
            <span>₹{totals.total.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <button 
              onClick={() => handleCheckout("Cash")}
              disabled={cart.length === 0 || busy || oversellItems.length > 0}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-white bg-emerald-700 hover:bg-[#1C513E] disabled:opacity-50 transition-colors shadow-sm"
            >
              <Banknote className="w-5 h-5" /> Cash
            </button>
            <button 
              onClick={() => handleCheckout("UPI/Card")}
              disabled={cart.length === 0 || busy || oversellItems.length > 0}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-800 disabled:opacity-50 transition-colors shadow-sm"
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />} Digital
            </button>
          </div>
        </div>
      </div>

      {/* New Customer Modal */}
      {showNewCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <h3 className="text-xl font-semibold text-zinc-950">New Customer</h3>
              <button onClick={() => setShowNewCustomer(false)} className="text-zinc-400 hover:text-zinc-950 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-950 mb-1.5">Name *</label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={e => setNewCustomerName(e.target.value)}
                  className="w-full border border-zinc-300 rounded-xl px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-950"
                  placeholder="Customer Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-950 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={newCustomerPhone}
                  onChange={e => setNewCustomerPhone(e.target.value)}
                  className="w-full border border-zinc-300 rounded-xl px-4 py-2.5 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-950"
                  placeholder="Phone Number"
                />
              </div>
            </div>
            <div className="p-6 border-t border-zinc-200 bg-zinc-50/50 flex justify-end gap-3">
              <button onClick={() => setShowNewCustomer(false)} className="px-5 py-2.5 rounded-xl font-medium text-zinc-500 hover:bg-zinc-100 transition-colors">Cancel</button>
              <button 
                onClick={handleCreateCustomer}
                disabled={!newCustomerName || isCreatingCustomer}
                className="px-5 py-2.5 rounded-xl font-medium text-white bg-zinc-950 hover:bg-blue-800 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isCreatingCustomer && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
