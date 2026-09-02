"use client"

import { forwardRef } from "react"

type ReceiptItem = {
  name: string
  quantity: number
  price: number
  tax: number
  total: number
}

type ReceiptData = {
  businessName: string
  orderNumber: string
  orderDate: string
  customerName?: string
  items: ReceiptItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentMethod: string
  paymentStatus?: string
}

const ReceiptTemplate = forwardRef<HTMLDivElement, { receipt: ReceiptData }>(
  function ReceiptTemplate({ receipt }, ref) {
    return (
      <div ref={ref} id="receipt-print-area" className="bg-white text-[#17153B] w-full max-w-[320px] mx-auto font-mono text-xs">
        {/* Header */}
        <div className="text-center border-b border-dashed border-[#D9D5E4] pb-3 mb-3">
          <p className="font-bold text-sm uppercase tracking-wider">{receipt.businessName}</p>
          <p className="text-[#68647A] mt-1">Tax Invoice</p>
        </div>

        {/* Order Info */}
        <div className="border-b border-dashed border-[#D9D5E4] pb-3 mb-3 space-y-1">
          <div className="flex justify-between">
            <span className="text-[#68647A]">Order #</span>
            <span className="font-medium">{receipt.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#68647A]">Date</span>
            <span>{receipt.orderDate}</span>
          </div>
          {receipt.customerName && (
            <div className="flex justify-between">
              <span className="text-[#68647A]">Customer</span>
              <span>{receipt.customerName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[#68647A]">Payment</span>
            <span>{receipt.paymentMethod}</span>
          </div>
        </div>

        {/* Items */}
        <div className="border-b border-dashed border-[#D9D5E4] pb-3 mb-3">
          <div className="flex justify-between text-[#68647A] mb-2">
            <span className="flex-1">Item</span>
            <span className="w-8 text-center">Qty</span>
            <span className="w-16 text-right">Rate</span>
            <span className="w-16 text-right">Amt</span>
          </div>
          {receipt.items.map((item, i) => (
            <div key={i} className="flex justify-between py-0.5">
              <span className="flex-1 truncate pr-1">{item.name}</span>
              <span className="w-8 text-center">{item.quantity}</span>
              <span className="w-16 text-right">₹{item.price.toLocaleString()}</span>
              <span className="w-16 text-right">₹{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="space-y-1 border-b border-dashed border-[#D9D5E4] pb-3 mb-3">
          <div className="flex justify-between">
            <span className="text-[#68647A]">Subtotal</span>
            <span>₹{receipt.subtotal.toLocaleString()}</span>
          </div>
          {receipt.discount > 0 && (
            <div className="flex justify-between text-[#3C8F70]">
              <span>Discount</span>
              <span>-₹{receipt.discount.toLocaleString()}</span>
            </div>
          )}
          {receipt.tax > 0 && (
            <div className="flex justify-between">
              <span className="text-[#68647A]">Tax</span>
              <span>₹{receipt.tax.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm pt-1 border-t border-[#E7E4EF]">
            <span>TOTAL</span>
            <span>₹{receipt.total.toLocaleString()}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[#9A94A8] space-y-1">
          <p>Thank you for your purchase!</p>
          <p className="text-[10px]">Powered by Nexora</p>
        </div>

        {/* Print styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * { visibility: hidden !important; }
            #receipt-print-area, #receipt-print-area * { visibility: visible !important; }
            #receipt-print-area {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 80mm !important;
              max-width: 80mm !important;
              padding: 4mm !important;
              font-size: 10px !important;
            }
          }
        `}} />
      </div>
    )
  }
)

export default ReceiptTemplate
