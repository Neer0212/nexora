import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitInventoryTransaction } from '../src/app/pos/inventory/actions';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const mockRpc = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    rpc: mockRpc,
  })),
}));

vi.mock('@/lib/workspace-data', () => ({
  getWorkspaceContext: vi.fn().mockResolvedValue({ businessId: 'b-123' }),
}));

describe('inventory actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects transaction for invalid workspace', async () => {
    const result = await submitInventoryTransaction('wrong-business', {
      product_id: 'p-1',
      transaction_type: 'adjustment',
      quantity: 5,
      is_negative: false,
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized workspace');
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('rejects negative quantity (zod validation)', async () => {
    const result = await submitInventoryTransaction('b-123', {
      product_id: 'p-1',
      transaction_type: 'adjustment',
      quantity: -5, // invalid
      is_negative: false,
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Quantity must be positive');
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('submits a valid stock increase', async () => {
    mockRpc.mockResolvedValueOnce({ data: 15, error: null });

    const result = await submitInventoryTransaction('b-123', {
      product_id: 'p-1',
      transaction_type: 'purchase',
      quantity: 10,
      is_negative: false,
    });

    expect(result.success).toBe(true);
    expect(result.newStock).toBe(15);
    expect(mockRpc).toHaveBeenCalledWith('atomic_stock_adjustment', {
      p_business_id: 'b-123',
      p_product_id: 'p-1',
      p_delta: 10,
      p_type: 'purchase',
      p_unit_cost: null,
      p_supplier_id: null,
      p_reference: null,
    });
  });

  it('submits a valid stock decrease', async () => {
    mockRpc.mockResolvedValueOnce({ data: 5, error: null });

    const result = await submitInventoryTransaction('b-123', {
      product_id: 'p-1',
      transaction_type: 'adjustment',
      quantity: 5,
      is_negative: true,
    });

    expect(result.success).toBe(true);
    expect(result.newStock).toBe(5);
    expect(mockRpc).toHaveBeenCalledWith('atomic_stock_adjustment', {
      p_business_id: 'b-123',
      p_product_id: 'p-1',
      p_delta: -5,
      p_type: 'adjustment',
      p_unit_cost: null,
      p_supplier_id: null,
      p_reference: null,
    });
  });

  it('handles negative-stock database protection', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'new row for relation "products" violates check constraint "products_stock_quantity_check"' } });

    const result = await submitInventoryTransaction('b-123', {
      product_id: 'p-1',
      transaction_type: 'adjustment',
      quantity: 100,
      is_negative: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Insufficient stock to complete this transaction.');
  });
  
  it('handles invalid/nonexistent product from RPC', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'Product not found for this business' } });

    const result = await submitInventoryTransaction('b-123', {
      product_id: 'invalid-p',
      transaction_type: 'adjustment',
      quantity: 5,
      is_negative: false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Product not found for this business');
  });
});
