"use client"

import { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, Calendar, Printer, X, ShoppingBag, RotateCcw, Loader2, AlertCircle, CheckCircle, CreditCard } from "lucide-react"
import { processReturn } from "./actions"
import ReceiptTemplate from "@/components/shared/ReceiptTemplate"

type OrderItem = {
  id: string
  product_name_snapshot: string
  sku_snapshot: string | null
  quantity: number
  unit_price: number
  discount: number
  tax: number
  total_amount: number
}

type Order = {
  id: string
  order_number: string
  status: string
  order_date: string
  created_at: string
  subtotal: number
  discount: number
  tax_amount: number
  total_amount: number
  payment_method: string | null
  payment_status: string
  customer: { id: string; name: string; phone: string | null; email: string | null } | null
  items: OrderItem[]
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  confirmed: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Completed" },
  returned: { bg: "bg-[#F5EAEA]", text: "text-rose-800", label: "Returned" },
  draft: { bg: "bg-zinc-100", text: "text-blue-600", label: "Draft" },
}

export default function OrdersClient({ orders, businessId, businessName }: {
  orders: Order[]
  businessId: string
  businessName: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("all")

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [confirmReturn, setConfirmReturn] = useState<Order | null>(null)
  const [isPending, startTransition] = useTransition()
  const [returnResult, setReturnResult] = useState<{ success: boolean; message: string } | null>(null)

  const uniquePaymentMethods = useMemo(() => {
    const methods = new Set(orders.map(o => o.payment_method).filter(Boolean))
    return Array.from(methods) as string[]
  }, [orders])

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const searchMatch = o.order_number.toLowerCase().includes(search.toLowerCase()) || 
        (o.customer?.name?.toLowerCase().includes(search.toLowerCase()))
      
      let dateMatch = true
      if (startDate) {
        const oDate = new Date(o.created_at)
        const sDate = new Date(startDate)
        sDate.setHours(0, 0, 0, 0)
        if (oDate < sDate) dateMatch = false
      }
      if (endDate) {
        const oDate = new Date(o.created_at)
        const eDate = new Date(endDate)
        eDate.setHours(23, 59, 59, 999)
        if (oDate > eDate) dateMatch = false
      }

      let payMatch = true
      if (paymentMethod !== "all") {
        if ((o.payment_method || "").toLowerCase() !== paymentMethod.toLowerCase()) {
          payMatch = false
        }
      }

      return searchMatch && dateMatch && payMatch
    })
  }, [orders, search, startDate, endDate, paymentMethod])

  const handlePrint = () => {
    window.print()
  }

  const handleReturn = (order: Order) => {
    setSelectedOrder(null)
    setConfirmReturn(order)
  }

  const confirmProcessReturn = () => {
    if (!confirmReturn) return
    startTransition(async () => {
      const res = await processReturn(businessId, confirmReturn.id)
      if (res.success) {
        setReturnResult({ success: true, message: `Return processed. Stock re-credited.` })
        setConfirmReturn(null)
        router.refresh()
      } else {
        setReturnResult({ success: false, message: res.error || "Return failed" })
        setConfirmReturn(null)
      }
    })
  }

  const statusStyle = (status: string) => STATUS_STYLES[status] || STATUS_STYLES["draft"]

  // Build receipt data
  const receiptData = selectedOrder ? {
    businessName,
    orderNumber: selectedOrder.order_number,
    orderDate: new Date(selectedOrder.created_at).toLocaleString(),
    customerName: selectedOrder.customer?.name || undefined,
    items: selectedOrder.items.map(item => ({
      name: item.product_name_snapshot,
      quantity: item.quantity,
      price: Number(item.unit_price),
      tax: Number(item.tax),
      total: Number(item.total_amount)
    })),
    subtotal: Number(selectedOrder.subtotal),
    discount: Number(selectedOrder.discount),
    tax: Number(selectedOrder.tax_amount),
    total: Number(selectedOrder.total_amount),
    paymentMethod: selectedOrder.payment_method || "Unknown",
    paymentStatus: selectedOrder.payment_status
  } : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-blue-600">Operations</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Order History</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">View past transactions, reprint receipts, and process returns.</p>
        </div>
      </div>

      {returnResult && (
        <div className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-sm ${returnResult.success ? "border-emerald-600/20 bg-emerald-50 text-emerald-700" : "border-rose-600/20 bg-[#F5EAEA] text-rose-800"}`}>
          <div className="flex items-center gap-2">
            {returnResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {returnResult.message}
          </div>
          <button onClick={() => setReturnResult(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Filters Section */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input 
              type="text"
              placeholder="Search by order or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 text-sm text-zinc-950 placeholder-zinc-400 outline-none transition-all"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 text-sm text-zinc-950 outline-none transition-all"
              title="Start Date"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 text-sm text-zinc-950 outline-none transition-all"
              title="End Date"
            />
          </div>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-blue-600/20 text-sm text-zinc-950 outline-none transition-all appearance-none"
            >
              <option value="all">All Payment Methods</option>
              {uniquePaymentMethods.map(pm => (
                <option key={pm} value={pm}>{pm}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-zinc-500">Order No.</th>
                <th className="px-6 py-4 font-semibold text-zinc-500">Date & Time</th>
                <th className="px-6 py-4 font-semibold text-zinc-500">Customer</th>
                <th className="px-6 py-4 font-semibold text-zinc-500 text-right">Total</th>
                <th className="px-6 py-4 font-semibold text-zinc-500">Payment</th>
                <th className="px-6 py-4 font-semibold text-zinc-500">Status</th>
                <th className="px-6 py-4 font-semibold text-zinc-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    <ShoppingBag className="mx-auto h-8 w-8 text-blue-200 mb-3" />
                    <p className="font-medium text-zinc-950">No orders found</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(o => {
                  const style = statusStyle(o.status)
                  return (
                    <tr key={o.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-zinc-950">{o.order_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{new Date(o.created_at).toLocaleDateString()}</span>
                          <span className="text-xs text-zinc-400 ml-1">{new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {o.customer ? (
                          <div>
                            <p className="font-medium text-zinc-950">{o.customer.name}</p>
                            {o.customer.phone && <p className="text-xs text-zinc-500">{o.customer.phone}</p>}
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic">Walk-in</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-zinc-950">
                        ₹{Number(o.total_amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-zinc-950">{o.payment_method || "—"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedOrder(o)} 
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors border border-transparent hover:border-zinc-200"
                          >
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Spacious Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/30 backdrop-blur-sm print:hidden overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden border border-zinc-200 max-h-[90vh] flex flex-col my-auto">
            <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-zinc-950">Order Details</h2>
                <p className="text-sm text-zinc-500 mt-1">Order #{selectedOrder.order_number}</p>
              </div>
              <div className="flex gap-2">
                {selectedOrder.status === "confirmed" && (
                  <button onClick={() => handleReturn(selectedOrder)} className="px-4 py-2 text-sm font-medium text-rose-600 bg-[#F5EAEA] rounded-xl hover:bg-[#EDD9D9] flex items-center gap-2 transition-colors">
                    <RotateCcw className="w-4 h-4" /> Process Return
                  </button>
                )}
                <button onClick={handlePrint} className="px-4 py-2 text-sm font-medium text-blue-600 bg-zinc-100 rounded-xl hover:bg-[#E4E0F0] flex items-center gap-2 transition-colors" title="Print Receipt">
                  <Printer className="w-4 h-4" /> Print Receipt
                </button>
                <button onClick={() => setSelectedOrder(null)} className="p-2 text-zinc-400 hover:bg-zinc-200 rounded-xl transition-colors bg-white border border-zinc-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto bg-white flex flex-col md:flex-row gap-8">
              {/* Left Column: Items */}
              <div className="flex-1 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-950 mb-4">Items Purchased</h3>
                  <div className="space-y-4">
                    {selectedOrder.items.map(item => (
                      <div key={item.id} className="flex justify-between items-start p-4 rounded-xl border border-zinc-200 bg-zinc-50/50">
                        <div>
                          <p className="font-semibold text-zinc-950 text-base">{item.product_name_snapshot}</p>
                          {item.sku_snapshot && <p className="text-sm text-zinc-500 mt-0.5">SKU: {item.sku_snapshot}</p>}
                          <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500">
                            <span>Qty: {item.quantity}</span>
                            <span>Rate: ₹{Number(item.unit_price).toLocaleString()}</span>
                            {Number(item.discount) > 0 && <span className="text-emerald-600">Discount: -₹{Number(item.discount).toLocaleString()}</span>}
                            {Number(item.tax) > 0 && <span>Tax: ₹{Number(item.tax).toLocaleString()}</span>}
                          </div>
                        </div>
                        <p className="font-bold text-zinc-950 text-lg">₹{Number(item.total_amount).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Order Summary */}
              <div className="w-full md:w-80 flex-shrink-0 space-y-6">
                <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200">
                  <h3 className="text-sm font-semibold text-zinc-950 uppercase tracking-wider mb-4">Order Summary</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-zinc-500">
                      <span>Subtotal</span>
                      <span className="font-medium text-zinc-950">₹{Number(selectedOrder.subtotal).toLocaleString()}</span>
                    </div>
                    {Number(selectedOrder.tax_amount) > 0 && (
                      <div className="flex justify-between text-zinc-500">
                        <span>Tax</span>
                        <span className="font-medium text-zinc-950">₹{Number(selectedOrder.tax_amount).toLocaleString()}</span>
                      </div>
                    )}
                    {Number(selectedOrder.discount) > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount</span>
                        <span className="font-medium">-₹{Number(selectedOrder.discount).toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="pt-3 border-t border-zinc-200 flex justify-between items-center">
                      <span className="font-semibold text-zinc-950">Total</span>
                      <span className="font-bold text-zinc-950 text-xl">₹{Number(selectedOrder.total_amount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-zinc-200 bg-white space-y-4 text-sm">
                  <div>
                    <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Customer</span>
                    {selectedOrder.customer ? (
                      <div>
                        <p className="font-medium text-zinc-950">{selectedOrder.customer.name}</p>
                        {selectedOrder.customer.phone && <p className="text-zinc-500">{selectedOrder.customer.phone}</p>}
                        {selectedOrder.customer.email && <p className="text-zinc-500">{selectedOrder.customer.email}</p>}
                      </div>
                    ) : (
                      <p className="font-medium text-zinc-950 italic">Walk-in Customer</p>
                    )}
                  </div>
                  
                  <div>
                    <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Payment Method</span>
                    <p className="font-medium text-zinc-950">{selectedOrder.payment_method || "N/A"}</p>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Status</span>
                    <div className="mt-1">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider ${statusStyle(selectedOrder.status).bg} ${statusStyle(selectedOrder.status).text}`}>
                        {statusStyle(selectedOrder.status).label}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Date & Time</span>
                    <p className="font-medium text-zinc-950">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Receipt for Printing */}
      <div className="absolute -left-[9999px] top-0 print:static print:block opacity-0 print:opacity-100 pointer-events-none print:pointer-events-auto w-full">
        {receiptData && <ReceiptTemplate receipt={receiptData} />}
      </div>

      {/* Return Confirmation Modal */}
      {confirmReturn && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/30 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-[#F5EAEA] flex items-center justify-center">
                <RotateCcw className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-950">Process Return</h3>
                <p className="text-xs text-zinc-500">Order {confirmReturn.order_number}</p>
              </div>
            </div>
            <p className="text-sm text-zinc-500 mb-6">
              This will reverse the order, re-credit inventory for all items, and mark the order as returned. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmReturn(null)} disabled={isPending} className="px-5 py-2.5 text-sm font-medium text-zinc-500 bg-white border border-zinc-300 rounded-xl hover:bg-zinc-100 disabled:opacity-50 transition-colors">
                Cancel
              </button>
              <button onClick={confirmProcessReturn} disabled={isPending} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-rose-600 rounded-xl hover:bg-rose-800 disabled:opacity-50 shadow-sm transition-colors">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
