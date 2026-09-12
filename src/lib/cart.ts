export type CartProduct = {
  id: string
  name: string
  selling_price: number | null
  tax_rate: number | null
}

export type CartItem = {
  cartId: string
  product: CartProduct
  quantity: number
  customPrice: number
}

export function calculateCartTotals(cart: CartItem[], discount: number) {
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
  
  return {
    subtotal,
    tax,
    discount: discountAmt,
    total: subtotal + tax - discountAmt
  }
}
