import { createClient } from "@/lib/supabase/server"

type Row = Record<string, unknown>

export async function appendOperationalData(businessId: string, rows: { datasetId: string; rowNumber: number; row: Row }[]) {
  const supabase = await createClient()

  // 1. Fetch POS Orders with items
  const { data: posOrders } = await supabase
    .from("orders")
    .select(`
      id, order_number, order_date, total_amount, status,
      customer:customers(name),
      items:order_items(quantity, unit_price, total_amount, product_name_snapshot)
    `)
    .eq("business_id", businessId)

  if (posOrders) {
    posOrders.forEach(o => {
      const customerName = (o.customer as { name?: string })?.name || "Walk-in"
      if (o.items && o.items.length > 0) {
        o.items.forEach((item: { quantity?: number, unit_price?: number, total_amount?: number, product_name_snapshot?: string }) => {
          const qty = Number(item.quantity) || 0
          const unitPrice = Number(item.unit_price) || 0
          const lineTotal = Number(item.total_amount) || (unitPrice * qty)
          rows.push({
            datasetId: "pos-sales",
            rowNumber: 0,
            row: {
              order_id: o.order_number,
              revenue: lineTotal,
              order_date: o.order_date,
              date: o.order_date,
              status: o.status,
              quantity: qty,
              customer_name: customerName,
              product: item.product_name_snapshot || "Unknown Product"
            }
          })
        })
      } else {
        rows.push({
          datasetId: "pos-sales",
          rowNumber: 0,
          row: {
            order_id: o.order_number,
            revenue: o.total_amount,
            order_date: o.order_date,
            date: o.order_date,
            status: o.status,
            quantity: 0,
            customer_name: customerName,
            product: "Unknown Product"
          }
        })
      }
    })
  }

  // 2. Fetch POS Expenses
  const { data: posExpenses } = await supabase
    .from("expenses")
    .select("id, category, amount, expense_date")
    .eq("business_id", businessId)

  if (posExpenses) {
    posExpenses.forEach(e => {
      rows.push({
        datasetId: "pos-expenses",
        rowNumber: 0,
        row: {
          expense_category: e.category,
          amount: e.amount,
          expense: e.amount,
          date: e.expense_date,
          type: "expense"
        }
      })
    })
  }

  // 3. Fetch POS Inventory/Products
  const { data: posProducts } = await supabase
    .from("products")
    .select("id, name, stock_quantity, low_stock_threshold, unit_cost")
    .eq("business_id", businessId)

  if (posProducts) {
    posProducts.forEach(p => {
      rows.push({
        datasetId: "pos-inventory",
        rowNumber: 0,
        row: {
          product: p.name,
          stock_qty: p.stock_quantity ?? 0,
          unit_cost: p.unit_cost ?? 0,
          low_stock_threshold: p.low_stock_threshold ?? 10
        }
      })
    })
  }

  return rows
}
