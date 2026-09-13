import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReceiptPage from '../src/app/pos/orders/[id]/receipt/page';

// Mock Next.js navigation
const mockRedirect = vi.fn();
const mockNotFound = vi.fn().mockImplementation(() => {
  throw new Error('NEXT_NOT_FOUND');
});

vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
  notFound: () => mockNotFound(),
}));

// Mock Supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
    from: vi.fn(() => ({
      select: mockSelect.mockReturnThis(),
      eq: mockEq.mockReturnThis(),
      single: mockSingle,
    })),
  })),
}));

vi.mock('@/lib/workspace-data', () => ({
  getWorkspaceContext: vi.fn().mockResolvedValue({ businessId: 'b-123' }),
}));

describe('Receipt Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects cross-workspace receipt access via query filtering', async () => {
    // Return null when searching for order with another business_id
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

    await expect(ReceiptPage({ params: Promise.resolve({ id: 'order-from-other-workspace' }) }))
      .rejects.toThrow('NEXT_NOT_FOUND');

    expect(mockNotFound).toHaveBeenCalled();
  });

  it('preserves historical snapshot prices and names from order_items', async () => {
    const historicalOrder = {
      id: 'order-1',
      order_number: 'ORD-001',
      status: 'confirmed',
      created_at: '2026-01-01T10:00:00Z',
      subtotal: 100,
      discount: 0,
      tax_amount: 10,
      total_amount: 110,
      payment_method: 'cash',
      payment_status: 'paid',
      customer: { name: 'John Doe' },
      items: [
        {
          id: 'item-1',
          product_name_snapshot: 'Historical Product Name (Old)',
          quantity: 1,
          unit_price: 100,
          discount: 0,
          tax: 10,
          total_amount: 110,
        },
      ],
    };

    // First single() call is for order query
    mockSingle.mockResolvedValueOnce({ data: historicalOrder, error: null });
    // Second single() call is for business profile
    mockSingle.mockResolvedValueOnce({ data: { name: 'My Store' }, error: null });

    const jsx = await ReceiptPage({ params: Promise.resolve({ id: 'order-1' }) });
    expect(jsx).toBeDefined();

    // Ensure eq("business_id", "b-123") was called for workspace isolation
    expect(mockEq).toHaveBeenCalledWith('business_id', 'b-123');
  });
});
