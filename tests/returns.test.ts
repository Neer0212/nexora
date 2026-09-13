import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processReturn } from '../src/app/pos/orders/actions';

// Mock the Next.js cache and cookies modules before anything else
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock the Supabase client
const mockRpc = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
    },
    from: vi.fn(() => ({
      select: mockSelect.mockReturnThis(),
      eq: mockEq.mockReturnThis(),
      single: mockSingle,
      maybeSingle: mockMaybeSingle,
    })),
    rpc: mockRpc,
  })),
}));

vi.mock('@/lib/workspace-data', () => ({
  getWorkspaceContext: vi.fn().mockResolvedValue({ businessId: 'b-123' }),
}));

describe('processReturn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthorized workspace', async () => {
    const result = await processReturn('wrong-business', 'order-123');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized workspace');
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('successfully calls rpc for a valid return', async () => {
    mockRpc.mockResolvedValueOnce({ data: 'return-order-id', error: null });

    const result = await processReturn('b-123', 'order-123', 'Faulty item');
    expect(result.success).toBe(true);
    expect(result.returnOrderId).toBe('return-order-id');
    expect(mockRpc).toHaveBeenCalledWith('process_pos_return', expect.objectContaining({
      p_business_id: 'b-123',
      p_original_order_id: 'order-123',
      p_reason: 'Faulty item'
    }));
  });

  it('returns error when rpc fails', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'Order has already been returned' } });

    const result = await processReturn('b-123', 'order-123');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Order has already been returned');
  });

  it('handles idempotency key', async () => {
    mockRpc.mockResolvedValueOnce({ data: 'return-order-id', error: null });
    const iKey = '550e8400-e29b-41d4-a716-446655440000';

    const result = await processReturn('b-123', 'order-123', 'Duplicate return attempt', iKey);
    expect(result.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('process_pos_return', expect.objectContaining({
      p_idempotency_key: iKey
    }));
  });
});
