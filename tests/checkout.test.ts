import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processCheckout } from '../src/app/pos/actions';

// Mock the Next.js cache and cookies modules before anything else
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock the Supabase client
const mockRpc = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
    },
    from: vi.fn(() => ({
      select: mockSelect.mockReturnThis(),
      eq: mockEq.mockReturnThis(),
      in: mockIn.mockReturnThis(),
    })),
    rpc: mockRpc,
  })),
}));

vi.mock('@/lib/workspace-data', () => ({
  getWorkspaceContext: vi.fn().mockResolvedValue({ businessId: 'b-123' }),
}));

describe('processCheckout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects invalid workspace', async () => {
    const result = await processCheckout('wrong-business', {
      customer_id: null,
      subtotal: 100, discount: 0, tax: 0, total: 100,
      payment_method: 'cash',
      items: [{ product_id: 'p1', name: 'P1', quantity: 1, price: 100, cost: 50, discount: 0, tax: 0, total: 100 }],
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized workspace');
  });

  it('calculates totals server-side and calls rpc', async () => {
    // Mock database products returning stock and cost
    mockIn.mockResolvedValueOnce({
      data: [
        { id: 'p1', name: 'Product 1', selling_price: 100, unit_cost: 40, tax_rate: 10, stock_quantity: 10 }
      ]
    });
    mockRpc.mockResolvedValueOnce({ data: 'order-123', error: null });

    const result = await processCheckout('b-123', {
      customer_id: 'c1',
      subtotal: 0, discount: 10, tax: 0, total: 0, // Client totals are ignored
      payment_method: 'card',
      items: [{ product_id: 'p1', name: 'Product 1', quantity: 2, price: 90, cost: 0, discount: 0, tax: 0, total: 0 }],
    });

    expect(result.success).toBe(true);
    
    // Check RPC was called with recalculated totals
    // 2 * 90 = 180 subtotal
    // Tax = 180 * 0.10 = 18
    // Discount = 10
    // Total = 180 + 18 - 10 = 188
    expect(mockRpc).toHaveBeenCalledWith('process_pos_checkout', expect.objectContaining({
      p_subtotal: 180,
      p_tax: 18,
      p_discount: 10,
      p_total: 188,
      p_items: [expect.objectContaining({
        product_id: 'p1',
        quantity: 2,
        price: 90,
        cost: 40, // overridden from DB
        tax: 18,
        total: 198 // line total + tax
      })]
    }));
  });

  it('rejects checkout if stock is insufficient', async () => {
    mockIn.mockResolvedValueOnce({
      data: [
        { id: 'p1', name: 'Product 1', selling_price: 100, unit_cost: 40, tax_rate: 10, stock_quantity: 1 }
      ]
    });

    const result = await processCheckout('b-123', {
      customer_id: null,
      subtotal: 200, discount: 0, tax: 0, total: 200,
      payment_method: 'cash',
      items: [{ product_id: 'p1', name: 'Product 1', quantity: 2, price: 100, cost: 40, discount: 0, tax: 0, total: 200 }],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Insufficient stock for Product 1');
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('retries on order number collision', async () => {
    mockIn.mockResolvedValueOnce({
      data: [{ id: 'p1', name: 'Product 1', stock_quantity: 10 }]
    });

    // Mock RPC failing once with duplicate error, then succeeding
    mockRpc
      .mockResolvedValueOnce({ data: null, error: { message: 'duplicate key value violates unique constraint' } })
      .mockResolvedValueOnce({ data: 'order-123', error: null });

    const result = await processCheckout('b-123', {
      customer_id: null,
      subtotal: 100, discount: 0, tax: 0, total: 100,
      payment_method: 'cash',
      items: [{ product_id: 'p1', name: 'Product 1', quantity: 1, price: 100, cost: 0, discount: 0, tax: 0, total: 100 }],
    });

    expect(result.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledTimes(2);
  });
});
