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
  confirmed: { bg: "bg-[#EAF5F0]", text: "text-[#286B54]", label: "Completed" },
  returned: { bg: "bg-[#F5EAEA]", text: "text-[#8D3F3F]", label: "Returned" },
  draft: { bg: "bg-[#F0EEF6]", text: "text-[#433D8B]", label: "Draft" },
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#433D8B]">Operations</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#17153B] sm:text-4xl">Order History</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#68647A]">View past transactions, reprint receipts, and process returns.</p>
        </div>
      </div>

      {returnResult && (
        <div className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-sm ${returnResult.success ? "border-[#3C8F70]/20 bg-[#EAF5F0] text-[#286B54]" : "border-[#B85454]/20 bg-[#F5EAEA] text-[#8D3F3F]"}`}>
          <div className="flex items-center gap-2">
            {returnResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {returnResult.message}
          </div>
          <button onClick={() => setReturnResult(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Filters Section */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl border border-[#E7E4EF] shadow-[0_2px_10px_rgba(23,21,59,0.02)]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A94A8]" />
            <input 
              type="text"
              placeholder="Search by order or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#F7F5FA] border border-[#E7E4EF] rounded-xl focus:ring-2 focus:ring-[#433D8B]/20 text-sm text-[#17153B] placeholder-[#9A94A8] outline-none transition-all"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A94A8]" />
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#F7F5FA] border border-[#E7E4EF] rounded-xl focus:ring-2 focus:ring-[#433D8B]/20 text-sm text-[#17153B] outline-none transition-all"
              title="Start Date"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A94A8]" />
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#F7F5FA] border border-[#E7E4EF] rounded-xl focus:ring-2 focus:ring-[#433D8B]/20 text-sm text-[#17153B] outline-none transition-all"
              title="End Date"
            />
          </div>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A94A8]" />
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#F7F5FA] border border-[#E7E4EF] rounded-xl focus:ring-2 focus:ring-[#433D8B]/20 text-sm text-[#17153B] outline-none transition-all appearance-none"
            >
              <option value="all">All Payment Methods</option>
              {uniquePaymentMethods.map(pm => (
                <option key={pm} value={pm}>{pm}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#E7E4EF] shadow-[0_12px_35px_rgba(23,21,59,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7F5FA] border-b border-[#E7E4EF]">
              <tr>
                <th className="px-6 py-4 font-semibold text-[#68647A]">Order No.</th>
                <th className="px-6 py-4 font-semibold text-[#68647A]">Date & Time</th>
                <th className="px-6 py-4 font-semibold text-[#68647A]">Customer</th>
                <th className="px-6 py-4 font-semibold text-[#68647A] text-right">Total</th>
                <th className="px-6 py-4 font-semibold text-[#68647A]">Payment</th>
                <th className="px-6 py-4 font-semibold text-[#68647A]">Status</th>
                <th className="px-6 py-4 font-semibold text-[#68647A]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDF5]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#68647A]">
                    <ShoppingBag className="mx-auto h-8 w-8 text-[#C8ACD6] mb-3" />
                    <p className="font-medium text-[#17153B]">No orders found</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(o => {
                  const style = statusStyle(o.status)
                  return (
                    <tr key={o.id} className="hover:bg-[#FBFAFD] transition-colors">
                      <td className="px-6 py-4 font-medium text-[#17153B]">{o.order_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#9A94A8]" />
                          <span>{new Date(o.created_at).toLocaleDateString()}</span>
                          <span className="text-xs text-[#9A94A8] ml-1">{new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {o.customer ? (
                          <div>
                            <p className="font-medium text-[#17153B]">{o.customer.name}</p>
                            {o.customer.phone && <p className="text-xs text-[#68647A]">{o.customer.phone}</p>}
                          </div>
                        ) : (
                          <span className="text-[#9A94A8] italic">Walk-in</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-[#17153B]">
                        ₹{Number(o.total_amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[#17153B]">{o.payment_method || "—"}</span>
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
                            className="text-[#433D8B] hover:text-[#2E236C] text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[#F0EEF6] transition-colors border border-transparent hover:border-[#E7E4EF]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17153B]/30 backdrop-blur-sm print:hidden overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-[#E7E4EF] max-h-[90vh] flex flex-col my-auto">
            <div className="px-6 py-5 border-b border-[#E7E4EF] bg-[#FBFAFD] flex items-center justify-between sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-[#17153B]">Order Details</h2>
                <p className="text-sm text-[#68647A] mt-1">Order #{selectedOrder.order_number}</p>
              </div>
              <div className="flex gap-2">
                {selectedOrder.status === "confirmed" && (
                  <button onClick={() => handleReturn(selectedOrder)} className="px-4 py-2 text-sm font-medium text-[#B85454] bg-[#F5EAEA] rounded-xl hover:bg-[#EDD9D9] flex items-center gap-2 transition-colors">
                    <RotateCcw className="w-4 h-4" /> Process Return
                  </button>
                )}
                <button onClick={handlePrint} className="px-4 py-2 text-sm font-medium text-[#433D8B] bg-[#F0EEF6] rounded-xl hover:bg-[#E4E0F0] flex items-center gap-2 transition-colors" title="Print Receipt">
                  <Printer className="w-4 h-4" /> Print Receipt
                </button>
                <button onClick={() => setSelectedOrder(null)} className="p-2 text-[#9A94A8] hover:bg-[#E7E4EF] rounded-xl transition-colors bg-white border border-[#E7E4EF]">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto bg-white flex flex-col md:flex-row gap-8">
              {/* Left Column: Items */}
              <div className="flex-1 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#17153B] mb-4">Items Purchased</h3>
                  <div className="space-y-4">
                    {selectedOrder.items.map(item => (
                      <div key={item.id} className="flex justify-between items-start p-4 rounded-xl border border-[#E7E4EF] bg-[#FBFAFD]">
                        <div>
                          <p className="font-semibold text-[#17153B] text-base">{item.product_name_snapshot}</p>
                          {item.sku_snapshot && <p className="text-sm text-[#68647A] mt-0.5">SKU: {item.sku_snapshot}</p>}
                          <div className="flex items-center gap-4 mt-2 text-sm text-[#68647A]">
                            <span>Qty: {item.quantity}</span>
                            <span>Rate: ₹{Number(item.unit_price).toLocaleString()}</span>
                            {Number(item.discount) > 0 && <span className="text-[#3C8F70]">Discount: -₹{Number(item.discount).toLocaleString()}</span>}
                            {Number(item.tax) > 0 && <span>Tax: ₹{Number(item.tax).toLocaleString()}</span>}
                          </div>
                        </div>
                        <p className="font-bold text-[#17153B] text-lg">₹{Number(item.total_amount).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Order Summary */}
              <div className="w-full md:w-80 flex-shrink-0 space-y-6">
                <div className="p-5 rounded-2xl bg-[#F7F5FA] border border-[#E7E4EF]">
                  <h3 className="text-sm font-semibold text-[#17153B] uppercase tracking-wider mb-4">Order Summary</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-[#68647A]">
                      <span>Subtotal</span>
                      <span className="font-medium text-[#17153B]">₹{Number(selectedOrder.subtotal).toLocaleString()}</span>
                    </div>
                    {Number(selectedOrder.tax_amount) > 0 && (
                      <div className="flex justify-between text-[#68647A]">
                        <span>Tax</span>
                        <span className="font-medium text-[#17153B]">₹{Number(selectedOrder.tax_amount).toLocaleString()}</span>
                      </div>
                    )}
                    {Number(selectedOrder.discount) > 0 && (
                      <div className="flex justify-between text-[#3C8F70]">
                        <span>Discount</span>
                        <span className="font-medium">-₹{Number(selectedOrder.discount).toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="pt-3 border-t border-[#E7E4EF] flex justify-between items-center">
                      <span className="font-semibold text-[#17153B]">Total</span>
                      <span className="font-bold text-[#17153B] text-xl">₹{Number(selectedOrder.total_amount).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-[#E7E4EF] bg-white space-y-4 text-sm">
                  <div>
                    <span className="block text-xs font-semibold text-[#68647A] uppercase tracking-wider mb-1">Customer</span>
                    {selectedOrder.customer ? (
                      <div>
                        <p className="font-medium text-[#17153B]">{selectedOrder.customer.name}</p>
                        {selectedOrder.customer.phone && <p className="text-[#68647A]">{selectedOrder.customer.phone}</p>}
                        {selectedOrder.customer.email && <p className="text-[#68647A]">{selectedOrder.customer.email}</p>}
                      </div>
                    ) : (
                      <p className="font-medium text-[#17153B] italic">Walk-in Customer</p>
                    )}
                  </div>
                  
                  <div>
                    <span className="block text-xs font-semibold text-[#68647A] uppercase tracking-wider mb-1">Payment Method</span>
                    <p className="font-medium text-[#17153B]">{selectedOrder.payment_method || "N/A"}</p>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-[#68647A] uppercase tracking-wider mb-1">Status</span>
                    <div className="mt-1">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider ${statusStyle(selectedOrder.status).bg} ${statusStyle(selectedOrder.status).text}`}>
                        {statusStyle(selectedOrder.status).label}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-[#68647A] uppercase tracking-wider mb-1">Date & Time</span>
                    <p className="font-medium text-[#17153B]">{new Date(selectedOrder.created_at).toLocaleString()}</p>
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#17153B]/30 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-[#E7E4EF] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-[#F5EAEA] flex items-center justify-center">
                <RotateCcw className="h-5 w-5 text-[#B85454]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#17153B]">Process Return</h3>
                <p className="text-xs text-[#68647A]">Order {confirmReturn.order_number}</p>
              </div>
            </div>
            <p className="text-sm text-[#68647A] mb-6">
              This will reverse the order, re-credit inventory for all items, and mark the order as returned. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmReturn(null)} disabled={isPending} className="px-5 py-2.5 text-sm font-medium text-[#68647A] bg-white border border-[#D9D5E4] rounded-xl hover:bg-[#F3F1F6] disabled:opacity-50 transition-colors">
                Cancel
              </button>
              <button onClick={confirmProcessReturn} disabled={isPending} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#B85454] rounded-xl hover:bg-[#8D3F3F] disabled:opacity-50 shadow-sm transition-colors">
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
