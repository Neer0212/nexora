import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveSupplier, getSupplierActivity } from '../src/app/pos/suppliers/actions';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const mockChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  then: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => mockChain),
  })),
}));

vi.mock('@/lib/workspace-data', () => ({
  getWorkspaceContext: vi.fn().mockResolvedValue({ businessId: 'b-123' }),
}));

describe('suppliers actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects supplier creation for invalid workspace', async () => {
    await expect(saveSupplier('wrong-business', {
      name: 'Test Supplier',
      status: 'Active',
    })).rejects.toThrow('Unauthorized workspace');
  });

  it('rejects supplier creation with missing name', async () => {
    await expect(saveSupplier('b-123', {
      name: '',
      status: 'Active',
    })).rejects.toThrow();
  });

  it('creates supplier successfully', async () => {
    mockChain.then.mockImplementation((cb) => cb({ error: null }));

    await saveSupplier('b-123', {
      name: 'New Supplier',
      email: 'test@example.com',
      status: 'Active',
    });

    expect(mockChain.insert).toHaveBeenCalled();
  });

  it('updates supplier successfully', async () => {
    mockChain.then.mockImplementation((cb) => cb({ error: null }));

    await saveSupplier('b-123', {
      id: 'sup-1',
      name: 'Updated Supplier',
      status: 'Inactive', // Archive behavior
    });

    expect(mockChain.update).toHaveBeenCalled();
  });

  it('retrieves supplier activity correctly isolated', async () => {
    mockChain.then.mockImplementation((cb) => cb({ data: [], error: null }));

    const res = await getSupplierActivity('b-123', 'sup-1');
    expect(res.transactions).toEqual([]);
    expect(res.purchases).toEqual([]);
    expect(mockChain.eq).toHaveBeenCalledWith('business_id', 'b-123');
  });
});
