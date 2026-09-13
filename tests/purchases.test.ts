import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPurchase, receivePurchase, cancelPurchase } from '../src/app/pos/purchases/actions';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const mockChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  single: vi.fn(),
  then: vi.fn(),
};

const mockRpc = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => mockChain),
    rpc: mockRpc,
  })),
}));

vi.mock('@/lib/workspace-data', () => ({
  getWorkspaceContext: vi.fn().mockResolvedValue({ businessId: 'b-123' }),
}));

describe('purchases actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects purchase creation for invalid workspace', async () => {
    const res = await createPurchase('wrong-business', {
      supplier_id: '123e4567-e89b-12d3-a456-426614174000',
      items: [{ product_id: '123e4567-e89b-12d3-a456-426614174001', quantity: 10, unit_cost: 5 }]
    });
    expect(res.error).toBe('Unauthorized workspace');
  });

  it('rejects invalid quantity', async () => {
    const res = await createPurchase('b-123', {
      supplier_id: '123e4567-e89b-12d3-a456-426614174000',
      items: [{ product_id: '123e4567-e89b-12d3-a456-426614174001', quantity: -10, unit_cost: 5 }]
    });
    expect(res.error).toBe('Invalid data provided');
  });

  it('creates purchase successfully', async () => {
    mockChain.single.mockResolvedValueOnce({ data: { id: 'purchase-id' }, error: null }); // for purchase insert
    mockChain.then.mockImplementationOnce((cb) => cb({ error: null })); // for items insert

    const res = await createPurchase('b-123', {
      supplier_id: '123e4567-e89b-12d3-a456-426614174000',
      items: [{ product_id: '123e4567-e89b-12d3-a456-426614174001', quantity: 10, unit_cost: 5 }]
    });

    expect(res.success).toBe(true);
    expect(mockChain.insert).toHaveBeenCalledTimes(2); // once for purchase, once for items
  });

  it('rejects receive purchase for invalid workspace', async () => {
    const res = await receivePurchase('wrong-business', 'p-1', []);
    expect(res.error).toBe('Unauthorized workspace');
  });

  it('receives purchase successfully', async () => {
    mockRpc.mockResolvedValueOnce({ error: null });

    const res = await receivePurchase('b-123', 'p-1', [{
      product_id: '123e4567-e89b-12d3-a456-426614174001', quantity_received: 10, unit_cost: 5
    }]);

    expect(res.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('process_stock_in', {
      p_business_id: 'b-123',
      p_purchase_id: 'p-1',
      p_items: [{ product_id: '123e4567-e89b-12d3-a456-426614174001', quantity_received: 10, unit_cost: 5 }]
    });
  });

  it('cancels purchase successfully', async () => {
    mockChain.single.mockResolvedValueOnce({ data: { status: 'draft' }, error: null });
    mockChain.then.mockImplementationOnce((cb) => cb({ error: null }));

    const res = await cancelPurchase('b-123', 'p-1');
    expect(res.success).toBe(true);
  });

  it('rejects cancel purchase if not draft/ordered', async () => {
    mockChain.single.mockResolvedValueOnce({ data: { status: 'received' }, error: null });

    const res = await cancelPurchase('b-123', 'p-1');
    expect(res.error).toBe('Only draft or ordered purchases can be cancelled');
  });
});
