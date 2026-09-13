import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getWorkspaceContext } from "@/lib/workspace-data"
import ReceiptTemplate from "@/components/shared/ReceiptTemplate"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import PrintButton from "./PrintButton"

export const metadata: Metadata = {
  title: "Order Receipt",
  description: "View and print transaction receipt.",
  robots: { index: false, follow: false },
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function ReceiptPage({ params }: Props) {
  const { id: orderId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const context = await getWorkspaceContext().catch(() => null)
  if (!context) redirect("/onboarding")

  // Fetch the order ensuring it belongs to the current workspace
  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      id, order_number, status, order_date, created_at, subtotal, discount, tax_amount, total_amount, payment_method, payment_status,
      customer:customers(id, name, phone, email),
      items:order_items(
        id, product_name_snapshot, sku_snapshot, quantity, unit_price, discount, tax, total_amount
      )
    `)
    .eq("id", orderId)
    .eq("business_id", context.businessId)
    .single()

  if (error || !order) {
    notFound()
  }

  // Fetch business details
  const { data: business } = await supabase
    .from("businesses")
    .select("name")
    .eq("id", context.businessId)
    .single()

  const receiptData = {
    businessName: business?.name || "Nexora Business",
    orderNumber: order.order_number,
    orderDate: new Date(order.created_at).toLocaleString(),
    customerName: (order.customer as unknown as { name?: string })?.name || undefined,
    items: (order.items || []).map((item: { product_name_snapshot: string, quantity: number, unit_price: number, tax: number | null, total_amount: number }) => ({
      name: item.product_name_snapshot,
      quantity: Number(item.quantity),
      price: Number(item.unit_price),
      tax: Number(item.tax || 0),
      total: Number(item.total_amount),
    })),
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    tax: Number(order.tax_amount),
    total: Number(order.total_amount),
    paymentMethod: order.payment_method || "Unknown",
    paymentStatus: order.payment_status,
  }

  return (
    <div className="min-h-screen bg-zinc-100 p-4 md:p-8">
      {/* Navigation and actions bar - hidden when printing */}
      <div className="max-w-md mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/pos/orders"
          className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors bg-white px-3 py-1.5 rounded-lg border border-zinc-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
        <PrintButton />
      </div>

      {/* Main receipt container */}
      <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
        <ReceiptTemplate receipt={receiptData} />
      </div>
    </div>
  )
}
