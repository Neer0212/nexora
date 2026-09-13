import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveProduct, toggleProductActive } from '../src/app/pos/products/actions';

// Mock the Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const mockChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn(),
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

describe('products actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects product creation for invalid workspace', async () => {
    const result = await saveProduct('wrong-business', {
      name: 'Test Product',
      selling_price: 10,
      stock_quantity: 0,
      low_stock_threshold: 0,
      active: true,
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized workspace');
  });

  it('rejects product creation with negative price', async () => {
    const result = await saveProduct('b-123', {
      name: 'Test Product',
      selling_price: -5,
      stock_quantity: 0,
      low_stock_threshold: 0,
      active: true,
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid product data'); // Zod validation fails
  });

  it('creates product when barcode and sku are unique', async () => {
    mockChain.maybeSingle.mockResolvedValue({ data: null }); 
    mockChain.then.mockImplementation((cb) => cb({ error: null })); // For insert

    const result = await saveProduct('b-123', {
      name: 'New Product',
      barcode: '12345',
      sku: 'SKU1',
      selling_price: 15,
      stock_quantity: 5,
      low_stock_threshold: 1,
      active: true,
    });

    expect(result.success).toBe(true);
  });

  it('rejects product creation with duplicate barcode', async () => {
    mockChain.maybeSingle.mockResolvedValueOnce({ data: { id: 'other-id' } });

    const result = await saveProduct('b-123', {
      name: 'Duplicate Barcode',
      barcode: '12345',
      selling_price: 15,
      stock_quantity: 0,
      low_stock_threshold: 0,
      active: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('barcode is already assigned');
  });

  it('rejects product creation with duplicate sku', async () => {
    mockChain.maybeSingle.mockResolvedValueOnce({ data: { id: 'other-id' } }); // SKU exists

    const result = await saveProduct('b-123', {
      name: 'Duplicate SKU',
      sku: 'SKU-DUP',
      selling_price: 15,
      stock_quantity: 0,
      low_stock_threshold: 0,
      active: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('SKU is already assigned');
  });

  it('allows updating product with same barcode', async () => {
    mockChain.maybeSingle.mockResolvedValueOnce({ data: { id: 'this-product-id' } });
    mockChain.maybeSingle.mockResolvedValueOnce({ data: null });
    mockChain.then.mockImplementation((cb) => cb({ error: null })); // For update

    const result = await saveProduct('b-123', {
      id: 'this-product-id',
      name: 'Updated Product',
      barcode: '12345',
      selling_price: 20,
      stock_quantity: 5,
      low_stock_threshold: 1,
      active: true,
    });

    expect(result.success).toBe(true);
  });

  it('toggles product active status', async () => {
    mockChain.then.mockImplementation((cb) => cb({ error: null })); // For update

    const result = await toggleProductActive('b-123', 'product-1', false);

    expect(result.success).toBe(true);
  });
});
