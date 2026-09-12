import { describe, it, expect } from 'vitest';
import { calculateCartTotals, type CartItem } from '../src/lib/cart';

describe('cart logic', () => {
  it('calculates totals correctly with tax and discount', () => {
    const cart: CartItem[] = [
      {
        cartId: '1',
        product: { id: 'p1', name: 'Product 1', selling_price: 100, tax_rate: 10 },
        quantity: 2,
        customPrice: 100
      },
      {
        cartId: '2',
        product: { id: 'p2', name: 'Product 2', selling_price: 50, tax_rate: 0 },
        quantity: 1,
        customPrice: 50
      }
    ];

    // subtotal = 100*2 + 50*1 = 250
    // tax = 200 * 0.1 = 20
    // discount = 20
    // total = 250 + 20 - 20 = 250
    const discount = 20;
    const totals = calculateCartTotals(cart, discount);

    expect(totals.subtotal).toBe(250);
    expect(totals.tax).toBe(20);
    expect(totals.discount).toBe(20);
    expect(totals.total).toBe(250);
  });

  it('caps discount at subtotal', () => {
    const cart: CartItem[] = [
      {
        cartId: '1',
        product: { id: 'p1', name: 'Product 1', selling_price: 100, tax_rate: 0 },
        quantity: 1,
        customPrice: 100
      }
    ];

    // subtotal = 100
    // discount requested = 150 -> actual discount = 100
    // total = 0
    const discount = 150;
    const totals = calculateCartTotals(cart, discount);

    expect(totals.discount).toBe(100);
    expect(totals.total).toBe(0);
  });

  it('handles custom price overrides correctly', () => {
    const cart: CartItem[] = [
      {
        cartId: '1',
        product: { id: 'p1', name: 'Product 1', selling_price: 100, tax_rate: 5 },
        quantity: 1,
        customPrice: 80 // Override price
      }
    ];

    // subtotal = 80
    // tax = 80 * 0.05 = 4
    // total = 84
    const totals = calculateCartTotals(cart, 0);

    expect(totals.subtotal).toBe(80);
    expect(totals.tax).toBe(4);
    expect(totals.total).toBe(84);
  });
});
