import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the modules at the top level
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));
vi.mock('@/lib/workspace-data', () => ({
  getWorkspaceContext: vi.fn(),
}));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ getAll: () => [] }),
}));

describe('Customer Management', () => {
  let mockSupabase: {
    auth: {
      getUser: ReturnType<typeof vi.fn>;
    };
    from: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    order: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    insert: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let mockWorkspaceData: {
    getWorkspaceContext: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    // Reset all mocks
    vi.resetAllMocks();

    // Get the mocked modules
    const { createClient } = await import('@/lib/supabase/server');
    const { getWorkspaceContext } = await import('@/lib/workspace-data');

    // Set up mockSupabase object with necessary chaining
    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn().mockReturnThis(),
      // We'll mock the specific methods per test, but let's set up the basic structure
      insert: vi.fn(),
      update: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn(),
    };
    // Make createClient return our mockSupabase
    createClient.mockResolvedValue(mockSupabase);

    // Set up mockWorkspaceData object
    mockWorkspaceData = {
      getWorkspaceContext: vi.fn(),
    };
    // Make getWorkspaceContext return our mockWorkspaceData's function
    getWorkspaceContext.mockImplementation(mockWorkspaceData.getWorkspaceContext);

    // Reset environment variables
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  describe('saveCustomer', () => {
    it('creates a new customer', async () => {
      // Mock the environment
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      // Mock the user
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'test-user-id' } } });
      // Mock workspace data
      mockWorkspaceData.getWorkspaceContext.mockResolvedValue({ businessId: 'b-123' });

      // Mock the insert method
      mockSupabase.insert.mockResolvedValue({
        data: [{ id: 'cust-123', name: 'Test Customer', email: 'test@example.com', phone: '1234567890', is_active: true }],
        error: null
      });

      // Import the function after setting env vars
      const { saveCustomer } = await import('../src/app/pos/customers/actions');

      const result = await saveCustomer('b-123', {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '1234567890',
        type: 'Individual',
        location: 'Test Location',
        is_active: true,
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        business_id: 'b-123',
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '1234567890',
        type: 'Individual',
        location: 'Test Location',
        is_active: true,
      });
    });

    it('updates an existing customer', async () => {
      // Mock the environment
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      // Mock the user
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'test-user-id' } } });
      // Mock workspace data
      mockWorkspaceData.getWorkspaceContext.mockResolvedValue({ businessId: 'b-123' });

      // Mock the update method and chained eq calls
      const mockSecondEq = vi.fn().mockResolvedValueOnce({ data: [{ id: 'cust-123' }], error: null });
      const mockFirstEq = vi.fn().mockReturnValue({
        eq: mockSecondEq
      });
      mockSupabase.update.mockReturnValue({
        eq: mockFirstEq
      });

      // Import the function after setting env vars
      const { saveCustomer } = await import('../src/app/pos/customers/actions');

      const result = await saveCustomer('b-123', {
        id: 'cust-123',
        name: 'Updated Customer',
        email: 'updated@example.com',
        phone: '0987654321',
        type: 'Business',
        location: 'Updated Location',
        is_active: false,
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith({
        business_id: 'b-123',
        name: 'Updated Customer',
        email: 'updated@example.com',
        phone: '0987654321',
        type: 'Business',
        location: 'Updated Location',
        is_active: false,
      });
      // Verify the eq calls were made with correct parameters
      expect(mockFirstEq).toHaveBeenCalledWith('id', 'cust-123');
      expect(mockSecondEq).toHaveBeenCalledWith('business_id', 'b-123');
    });

    it('rejects invalid customer data', async () => {
      // Mock the environment
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      // Mock the user (valid user so we get to validation)
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'test-user-id' } } });
      // Mock workspace data
      mockWorkspaceData.getWorkspaceContext.mockResolvedValue({ businessId: 'b-123' });

      // Import the function after setting env vars
      const { saveCustomer } = await import('../src/app/pos/customers/actions');

      const result = await saveCustomer('b-123', {
        name: '', // Empty name should fail validation
        email: 'invalid-email',
        phone: '123',
        type: 'Individual',
        location: '',
        is_active: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Name is required');
    });

    it('rejects unauthorized workspace', async () => {
      // Mock the environment
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      // Import the function after setting env vars
      const { saveCustomer } = await import('../src/app/pos/customers/actions');

      // Mock no user (unauthorized)
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
      // Mock workspace data (still needed for the function to proceed to the insert, but we'll mock insert to return empty)
      mockWorkspaceData.getWorkspaceContext.mockResolvedValue({ businessId: 'b-123' });
      mockSupabase.insert.mockResolvedValue({ data: [], error: null });

      const result = await saveCustomer('wrong-business', {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '1234567890',
        type: 'Individual',
        location: 'Test Location',
        is_active: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });
  });

  describe('getCustomerHistory', () => {
    it('returns customer order history', async () => {
      // Mock the environment
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      // Mock the user
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'test-user-id' } } });
      // Mock workspace data
      mockWorkspaceData.getWorkspaceContext.mockResolvedValue({ businessId: 'b-123' });

      // Mock the supabase client response
      const mockHistory = [
        {
          id: 'order-1',
          order_number: 'ORD-001',
          order_date: '2026-01-01',
          total_amount: 100,
          status: 'confirmed',
          payment_method: 'cash'
        },
        {
          id: 'order-2',
          order_number: 'ORD-002',
          order_date: '2026-01-02',
          total_amount: 200,
          status: 'returned',
          payment_method: 'card'
        }
      ];

      // Mock the chained calls: select().eq().eq().order().limit()
      const mockLimit = vi.fn().mockResolvedValueOnce({ data: mockHistory, error: null });
      const mockOrder = vi.fn().mockReturnValue({
        limit: mockLimit
      });
      const mockSecondEq = vi.fn().mockReturnValue({
        order: mockOrder
      });
      const mockFirstEq = vi.fn().mockReturnValue({
        eq: mockSecondEq
      });

      // Mock the from().select() chain - we need to mock the chained calls properly
      const mockSelect = vi.fn();
      const mockFirstEqMock = vi.fn().mockReturnValue({
        eq: mockSecondEq
      });
      const mockSecondEqMock = vi.fn().mockReturnValue({
        order: mockOrder
      });
      mockSelect.mockReturnValue({
        eq: mockFirstEqMock
      });
      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect
      });

      // Import the function after setting env vars
      const { getCustomerHistory } = await import('../src/app/pos/customers/actions');

      const result = await getCustomerHistory('b-123', 'cust-123');

      expect(result).toEqual(mockHistory);
      expect(mockSupabase.from).toHaveBeenCalledWith('orders');
      expect(mockSupabase.from().select).toHaveBeenCalledWith('id, order_number, order_date, total_amount, status, payment_method');
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('business_id', 'b-123');
      expect(mockSupabase.from().select().eq().eq).toHaveBeenCalledWith('customer_id', 'cust-123');
      expect(mockSupabase.from().select().eq().eq().order).toHaveBeenCalledWith('order_date', { ascending: false });
      expect(mockSupabase.from().select().eq().eq().order().limit).toHaveBeenCalledWith(50);
    });

    it('returns empty array on error', async () => {
      // Mock the environment
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      // Mock the user
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'test-user-id' } } });
      // Mock workspace data
      mockWorkspaceData.getWorkspaceContext.mockResolvedValue({ businessId: 'b-123' });

      // Mock the supabase client to return an error
      const mockLimit = vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'Database error' } });
      const mockOrder = vi.fn().mockReturnValue({
        limit: mockLimit
      });
      const mockSecondEq = vi.fn().mockReturnValue({
        order: mockOrder
      });
      const mockFirstEq = vi.fn().mockReturnValue({
        eq: mockSecondEq
      });

      // Mock the from().select() chain - we need to mock the chained calls properly
      const mockSelect = vi.fn();
      const mockFirstEqMock = vi.fn().mockReturnValue({
        eq: mockSecondEq
      });
      const mockSecondEqMock = vi.fn().mockReturnValue({
        order: mockOrder
      });
      mockSelect.mockReturnValue({
        eq: mockFirstEqMock
      });
      mockSupabase.from = vi.fn().mockReturnValue({
        select: mockSelect
      });

      // Import the function after setting env vars
      const { getCustomerHistory } = await import('../src/app/pos/customers/actions');

      const result = await getCustomerHistory('b-123', 'cust-123');

      expect(result).toEqual([]);
      expect(mockSupabase.from).toHaveBeenCalledWith('orders');
      expect(mockSupabase.from().select).toHaveBeenCalledWith('id, order_number, order_date, total_amount, status, payment_method');
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('business_id', 'b-123');
      expect(mockSupabase.from().select().eq().eq).toHaveBeenCalledWith('customer_id', 'cust-123');
      expect(mockSupabase.from().select().eq().eq().order).toHaveBeenCalledWith('order_date', { ascending: false });
      expect(mockSupabase.from().select().eq().eq().order().limit).toHaveBeenCalledWith(50);
    });
  });
});