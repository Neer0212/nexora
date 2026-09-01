"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Search, Receipt as ReceiptIcon, Calendar, Printer, X, ShoppingBag, RotateCcw, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { processReturn } from "./actions"

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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [confirmReturn, setConfirmReturn] = useState<Order | null>(null)
  const [isPending, startTransition] = useTransition()
  const [returnResult, setReturnResult] = useState<{ success: boolean; message: string } | null>(null)

  const filteredOrders = orders.filter(o => 
    o.order_number.toLowerCase().includes(search.toLowerCase()) || 
    (o.customer?.name?.toLowerCase().includes(search.toLowerCase()))
  )

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

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl border border-[#E7E4EF] shadow-[0_2px_10px_rgba(23,21,59,0.02)]">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9A94A8]" />
          <input 
            type="text"
            placeholder="Search by order number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-transparent border-none focus:ring-0 text-sm text-[#17153B] placeholder-[#9A94A8] outline-none"
          />
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
                <th className="px-6 py-4 font-semibold text-[#68647A]">Status</th>
                <th className="px-6 py-4 font-semibold text-[#68647A]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDF5]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#68647A]">
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
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedOrder(o)} 
                            className="text-[#433D8B] hover:text-[#2E236C] text-xs font-medium px-2 py-1 rounded-lg hover:bg-[#F0EEF6] transition-colors"
                          >
                            Receipt
                          </button>
                          {o.status === "confirmed" && (
                            <button 
                              onClick={() => handleReturn(o)}
                              className="text-[#B85454] hover:text-[#8D3F3F] text-xs font-medium px-2 py-1 rounded-lg hover:bg-[#F5EAEA] transition-colors flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" /> Return
                            </button>
                          )}
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

      {/* Receipt Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17153B]/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-[#E7E4EF]">
            <div className="px-6 py-4 border-b border-[#E7E4EF] bg-[#FBFAFD] flex items-center justify-between print:hidden">
              <h2 className="text-lg font-semibold text-[#17153B]">Receipt</h2>
              <div className="flex gap-2">
                {selectedOrder.status === "confirmed" && (
                  <button onClick={() => handleReturn(selectedOrder)} className="px-3 py-1.5 text-xs font-medium text-[#B85454] bg-[#F5EAEA] rounded-lg hover:bg-[#EDD9D9] flex items-center gap-1 transition-colors">
                    <RotateCcw className="w-3 h-3" /> Process Return
                  </button>
                )}
                <button onClick={handlePrint} className="p-2 text-[#9A94A8] hover:bg-[#E7E4EF] rounded-full transition-colors" title="Print">
                  <Printer className="w-5 h-5 text-[#433D8B]" />
                </button>
                <button onClick={() => setSelectedOrder(null)} className="p-2 text-[#9A94A8] hover:bg-[#E7E4EF] rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 font-mono text-sm text-[#17153B] bg-white" id="receipt-print-area">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold uppercase tracking-widest">{businessName}</h2>
                <p className="text-xs text-[#68647A] mt-1">Order: {selectedOrder.order_number}</p>
                <p className="text-xs text-[#68647A]">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                {selectedOrder.customer && (
                  <p className="text-xs text-[#68647A] mt-2">Customer: {selectedOrder.customer.name}</p>
                )}
                {selectedOrder.status === "returned" && (
                  <p className="text-xs font-bold text-[#B85454] mt-2 uppercase tracking-widest">— RETURNED —</p>
                )}
              </div>

              <div className="space-y-3 mb-6">
                {selectedOrder.items.map(item => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="pr-4">
                      <p className="font-semibold">{item.product_name_snapshot}</p>
                      <p className="text-xs text-[#68647A]">{item.quantity} x ₹{Number(item.unit_price).toLocaleString()}</p>
                    </div>
                    <p className="font-semibold">₹{Number(item.total_amount).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-[#D9D5E4] pt-4 space-y-2">
                <div className="flex justify-between text-[#68647A]">
                  <span>Subtotal</span><span>₹{Number(selectedOrder.subtotal).toLocaleString()}</span>
                </div>
                {Number(selectedOrder.tax_amount) > 0 && (
                  <div className="flex justify-between text-[#68647A]">
                    <span>Tax</span><span>₹{Number(selectedOrder.tax_amount).toLocaleString()}</span>
                  </div>
                )}
                {Number(selectedOrder.discount) > 0 && (
                  <div className="flex justify-between text-[#68647A]">
                    <span>Discount</span><span>-₹{Number(selectedOrder.discount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-dashed border-[#D9D5E4]">
                  <span>Total</span><span>₹{Number(selectedOrder.total_amount).toLocaleString()}</span>
                </div>
              </div>

              <div className="text-center mt-8 text-xs text-[#68647A]">
                <p>Payment: {selectedOrder.payment_method}</p>
                <p className="mt-2 font-medium">Thank you for your business!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return Confirmation Modal */}
      {confirmReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17153B]/20 backdrop-blur-sm">
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
              <button onClick={() => setConfirmReturn(null)} disabled={isPending} className="px-5 py-2.5 text-sm font-medium text-[#68647A] bg-white border border-[#D9D5E4] rounded-xl hover:bg-[#F3F1F6] disabled:opacity-50">
                Cancel
              </button>
              <button onClick={confirmProcessReturn} disabled={isPending} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#B85454] rounded-xl hover:bg-[#8D3F3F] disabled:opacity-50 shadow-sm">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #receipt-print-area, #receipt-print-area * { visibility: visible; }
          #receipt-print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}} />
    </div>
  )
}
