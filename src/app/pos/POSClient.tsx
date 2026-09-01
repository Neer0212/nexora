"use client"

import { useState, useRef, useEffect, useMemo, useTransition } from "react"
import { Search, Plus, Minus, X, CreditCard, Banknote, UserPlus, Package, Loader2, AlertCircle, Receipt, ShoppingBag, Tag, ExternalLink } from "lucide-react"
import { getPOSProducts, processCheckout, type CheckoutPayload } from "./actions"

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
  
  const [isPending, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successOrder, setSuccessOrder] = useState<string | null>(null)
  const [unknownBarcode, setUnknownBarcode] = useState<UnknownBarcode | null>(null)

  const barcodeInputRef = useRef<HTMLInputElement>(null)

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
  }, [])

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

  useEffect(() => {
    if (search.trim().length > 2) {
      const timer = setTimeout(async () => {
        const results = await getPOSProducts(businessId, search)
        setProducts(results)
      }, 300)
      return () => clearTimeout(timer)
    } else if (search.trim() === "") {
      setProducts(initialProducts)
    }
  }, [search, businessId, initialProducts])

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
    let subtotal = 0
    let tax = 0
    cart.forEach(item => {
      const price = item.customPrice
      const lineTotal = price * item.quantity
      subtotal += lineTotal
      const taxRate = item.product.tax_rate ?? 0
      tax += lineTotal * (taxRate / 100)
    })
    const discountAmt = Math.min(discount, subtotal)
    return { subtotal, tax, discount: discountAmt, total: subtotal + tax - discountAmt }
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

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Left Pane: Products */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)] overflow-hidden">
        <div className="p-4 border-b border-[#E7E4EF] bg-[#FBFAFD]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9A94A8]" />
            <input 
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan barcode or search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-[#D9D5E4] rounded-xl focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B] text-[#17153B] placeholder-[#9A94A8] outline-none transition-shadow"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-[#B85454]/20 bg-[#B85454]/5 p-3 text-sm text-[#8D3F3F]">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
            </div>
          )}

          {/* Unknown barcode prompt */}
          {unknownBarcode && (
            <div className="mb-4 rounded-xl border border-[#433D8B]/20 bg-[#F0EEF6] p-4">
              <p className="text-sm font-medium text-[#17153B]">Barcode not found: <code className="bg-white px-1.5 py-0.5 rounded text-[#433D8B] font-mono">{unknownBarcode.code}</code></p>
              <p className="text-xs text-[#68647A] mt-1">This barcode doesn&apos;t match any existing product.</p>
              <div className="flex gap-2 mt-3">
                <a 
                  href={`/pos/products?barcode=${encodeURIComponent(unknownBarcode.code)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#433D8B] rounded-lg hover:bg-[#2E236C] transition-colors"
                >
                  <ExternalLink className="w-3 h-3" /> Create Product
                </a>
                <button onClick={() => setUnknownBarcode(null)} className="px-3 py-1.5 text-xs font-medium text-[#68647A] bg-white rounded-lg border border-[#D9D5E4] hover:bg-[#F3F1F6]">
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {successOrder && (
            <div className="mb-4 flex items-center justify-between rounded-xl border border-[#3C8F70]/20 bg-[#3C8F70]/5 p-4 text-sm text-[#286B54]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Receipt className="h-5 w-5 text-[#3C8F70]" />
                </div>
                <div>
                  <p className="font-semibold text-[#17153B]">Checkout Successful</p>
                  <p>Order {successOrder} recorded and inventory updated.</p>
                </div>
              </div>
              <button onClick={() => setSuccessOrder(null)}><X className="h-4 w-4" /></button>
            </div>
          )}

          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#68647A] space-y-4">
              <Package className="h-12 w-12 text-[#C8ACD6]" />
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
                    className={`flex flex-col text-left rounded-2xl p-4 transition-all active:scale-[0.98] border ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-[#F7F5FA] border-[#E7E4EF]' : 'bg-white border-[#E7E4EF] hover:border-[#433D8B] hover:shadow-[0_4px_20px_rgba(67,61,139,0.08)]'}`}
                  >
                    <span className="font-semibold text-[#17153B] line-clamp-2 leading-tight mb-2">{p.name}</span>
                    <div className="mt-auto flex items-end justify-between w-full">
                      <span className="font-medium text-[#433D8B]">₹{Number(p.selling_price).toLocaleString()}</span>
                      <span className={`text-[10px] uppercase font-bold tracking-wider ${isOutOfStock ? 'text-[#B85454]' : isLowStock ? 'text-[#C58A3A]' : 'text-[#9A94A8]'}`}>
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
      <div className="w-full lg:w-[400px] xl:w-[480px] flex flex-col bg-white rounded-3xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)] overflow-hidden shrink-0">
        <div className="p-4 border-b border-[#E7E4EF] bg-[#FBFAFD] flex items-center justify-between">
          <h2 className="font-semibold text-[#17153B] flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#433D8B]" /> Current Cart
          </h2>
          <button onClick={() => setCart([])} disabled={cart.length === 0} className="text-xs font-medium text-[#68647A] hover:text-[#B85454] disabled:opacity-50 transition-colors">
            Clear
          </button>
        </div>

        <div className="p-4 border-b border-[#E7E4EF]">
          <div className="relative">
            <select
              value={selectedCustomer || ""}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full appearance-none rounded-xl border border-[#D9D5E4] bg-white pl-4 pr-10 py-2.5 text-sm text-[#17153B] outline-none focus:border-[#433D8B] focus:ring-1 focus:ring-[#433D8B]"
            >
              <option value="">Walk-in Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</option>
              ))}
            </select>
            <UserPlus className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A94A8] pointer-events-none" />
          </div>
        </div>

        {/* Oversell warning */}
        {oversellItems.length > 0 && (
          <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-[#C58A3A]/20 bg-[#FDF6EC] p-3 text-xs text-[#8B6020]">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#C58A3A]" />
            Insufficient stock: {oversellItems.map(i => i.product.name).join(", ")}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-[#9A94A8]">
              Cart is empty. Scan or select items.
            </div>
          ) : (
            cart.map(item => {
              const isOverSell = item.product.stock_quantity !== null && item.quantity > item.product.stock_quantity
              const lineTotal = item.customPrice * item.quantity
              return (
                <div key={item.cartId} className={`bg-[#FBFBFC] p-3 rounded-xl border ${isOverSell ? 'border-[#C58A3A]/30 bg-[#FDF6EC]' : 'border-[#F0EEF6]'}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#17153B] text-sm truncate">{item.product.name}</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded-lg border border-[#E7E4EF] p-1 shadow-sm">
                      <button onClick={() => updateQuantity(item.cartId, -1)} className="p-1 hover:bg-[#F0EEF6] rounded text-[#68647A]"><Minus className="w-3.5 h-3.5" /></button>
                      <span className="w-6 text-center text-sm font-medium text-[#17153B]">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cartId, 1)} className="p-1 hover:bg-[#F0EEF6] rounded text-[#68647A]"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="text-right min-w-[70px]">
                      <p className="font-medium text-[#17153B] text-sm">₹{lineTotal.toLocaleString()}</p>
                    </div>
                    <button onClick={() => removeCartItem(item.cartId)} className="p-1.5 text-[#CFC9DC] hover:text-[#B85454] rounded-md transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                  {/* Custom price override */}
                  <div className="mt-2 flex items-center gap-2">
                    <Tag className="w-3 h-3 text-[#9A94A8] shrink-0" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.customPrice}
                      onChange={e => updateCustomPrice(item.cartId, Number(e.target.value))}
                      className="w-24 text-xs px-2 py-1 border border-[#D9D5E4] rounded-lg outline-none focus:border-[#433D8B] text-[#17153B]"
                      title="Override unit price"
                    />
                    <span className="text-xs text-[#9A94A8]">unit price</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="p-5 border-t border-[#E7E4EF] bg-[#FBFAFD] space-y-3">
          <div className="flex justify-between text-sm text-[#68647A]">
            <span>Subtotal</span>
            <span>₹{totals.subtotal.toLocaleString()}</span>
          </div>
          {totals.tax > 0 && (
            <div className="flex justify-between text-sm text-[#68647A]">
              <span>Tax</span>
              <span>₹{totals.tax.toLocaleString()}</span>
            </div>
          )}
          {/* Discount input */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#68647A]">Discount</span>
            <div className="flex items-center gap-1">
              <span className="text-[#68647A]">₹</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discount || ""}
                onChange={e => setDiscount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-20 text-right text-sm px-2 py-0.5 border border-[#D9D5E4] rounded-lg outline-none focus:border-[#433D8B] text-[#17153B]"
              />
            </div>
          </div>

          <div className="flex justify-between text-xl font-bold text-[#17153B] pt-2 border-t border-[#E7E4EF]">
            <span>Total</span>
            <span>₹{totals.total.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <button 
              onClick={() => handleCheckout("Cash")}
              disabled={cart.length === 0 || busy || oversellItems.length > 0}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-white bg-[#286B54] hover:bg-[#1C513E] disabled:opacity-50 transition-colors shadow-sm"
            >
              <Banknote className="w-5 h-5" /> Cash
            </button>
            <button 
              onClick={() => handleCheckout("UPI/Card")}
              disabled={cart.length === 0 || busy || oversellItems.length > 0}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-white bg-[#433D8B] hover:bg-[#2E2A66] disabled:opacity-50 transition-colors shadow-sm"
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />} Digital
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
