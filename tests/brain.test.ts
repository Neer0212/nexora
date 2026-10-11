/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSupabaseQuery = {
  data: null as unknown,
  error: null as unknown,
  count: null as number | null,
};

const chainBuilder = (overrides: Partial<typeof mockSupabaseQuery> = {}) => {
  const result = { ...mockSupabaseQuery, ...overrides };
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    then: undefined,
  };
  Object.defineProperty(chain, Symbol.toStringTag, { value: "Promise" });
  chain[Symbol.iterator] = undefined;
  (chain as any)[Symbol.for("nodejs.rejection")] = undefined;
  const resolved = Promise.resolve(result);
  chain.then = resolved.then.bind(resolved);
  chain.catch = resolved.catch.bind(resolved);
  chain.finally = resolved.finally.bind(resolved);
  return chain;
};

let mockTables: Record<string, any> = {};
const mockFrom = vi.fn((table: string) => {
  const tableData = mockTables[table];
  return chainBuilder({
    data: tableData,
    count: table === "customers" ? (tableData?._count ?? 0) : null,
  });
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: mockFrom,
  })),
}));

import { getBrainData } from "../src/lib/brain-data";

describe("Phase 11 Business Brain Data Layer", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default healthy state
    mockTables = {
      businesses: [
        { name: "Test Biz", currency_code: "USD", industry: "retail" },
      ],
      orders: [],
      inventory: [],
      suppliers: [],
      order_items: [],
      customers: { _count: 0 },
    };
  });

  function todayUTC() {
    return new Date().toISOString().slice(0, 10);
  }

  function addDays(date: string, days: number): string {
    const result = new Date(`${date}T00:00:00Z`);
    result.setUTCDate(result.getUTCDate() + days);
    return result.toISOString().slice(0, 10);
  }

  it("calculates current and previous revenue with strict 30-day UTC windows", async () => {
    const today = todayUTC();
    const yesterday = addDays(today, -1);
    const day31Ago = addDays(today, -30); // previous window end

    mockTables.orders = [
      { total_amount: 100, order_date: today },
      { total_amount: 50, order_date: yesterday },
      { total_amount: 200, order_date: day31Ago },
      { total_amount: -25, order_date: yesterday }, // returned current
    ];

    const result = await getBrainData("biz-1");

    expect(result.currentRevenue).toBe(125); // 100 + 50 - 25
    expect(result.previousRevenue).toBe(200); // 200 - 0
    expect(result.revenueChange).toBe(((125 - 200) / 200) * 100);
    expect(result.currentOrdersCount).toBe(2);
  });

  it("correctly identifies inventory risks when quantity <= reorder_level", async () => {
    mockTables.inventory = [
      {
        product_id: "p1",
        quantity: 10,
        reorder_level: 10,
        unit_cost: 5,
        product: { name: "Low exactly", category: null },
      },
      {
        product_id: "p2",
        quantity: 5,
        reorder_level: 15,
        unit_cost: 10,
        product: { name: "Low strict", category: null },
      },
      {
        product_id: "p3",
        quantity: 20,
        reorder_level: 10,
        unit_cost: 2,
        product: { name: "Healthy", category: null },
      },
      {
        product_id: "p4",
        quantity: 5,
        reorder_level: null,
        unit_cost: 0,
        product: { name: "No reorder config", category: null },
      },
    ];

    const result = await getBrainData("biz-1");

    expect(result.inventoryValue).toBe(10 * 5 + 5 * 10 + 20 * 2 + 0);
    expect(result.lowStock).toHaveLength(2);

    const lowStockIds = result.lowStock.map((ls) => ls.productId);
    expect(lowStockIds).toContain("p1");
    expect(lowStockIds).toContain("p2");
    expect(lowStockIds).not.toContain("p3");
    expect(lowStockIds).not.toContain("p4");
  });

  it("correctly identifies supplier risks based on deterministic metrics", async () => {
    mockTables.suppliers = [
      {
        id: "s1",
        name: "Perfect",
        reliability: 99,
        average_lead_time: 2,
        status: "Active",
      },
      {
        id: "s2",
        name: "Unreliable",
        reliability: 79,
        average_lead_time: 5,
        status: "Active",
      },
      {
        id: "s3",
        name: "Slow",
        reliability: 90,
        average_lead_time: 10,
        status: "Active",
      },
      {
        id: "s4",
        name: "Poor Status",
        reliability: 95,
        average_lead_time: 3,
        status: "Watch",
      },
      {
        id: "s5",
        name: "No data",
        reliability: null,
        average_lead_time: null,
        status: "Active",
      },
    ];

    const result = await getBrainData("biz-1");

    expect(result.supplierRisks).toHaveLength(3);
    const riskIds = result.supplierRisks.map((sr) => sr.id);
    expect(riskIds).toContain("s2");
    expect(riskIds).toContain("s3");
    expect(riskIds).toContain("s4");
    expect(riskIds).not.toContain("s1");
    expect(riskIds).not.toContain("s5");
  });

  it("calculates top products opportunities correctly", async () => {
    mockTables.order_items = [
      {
        product_id: "p1",
        quantity: 2,
        total_amount: 100,
        product: { name: "Widget" },
      },
      {
        product_id: "p1",
        quantity: 1,
        total_amount: 50,
        product: { name: "Widget" },
      },
      {
        product_id: "p2",
        quantity: 5,
        total_amount: 25,
        product: { name: "Gadget" },
      },
    ];

    // p1 is also low stock
    mockTables.inventory = [
      {
        product_id: "p1",
        quantity: 0,
        reorder_level: 5,
        product: { name: "Widget" },
      },
      {
        product_id: "p2",
        quantity: 100,
        reorder_level: 5,
        product: { name: "Gadget" },
      },
    ];

    const result = await getBrainData("biz-1");

    expect(result.topProducts).toHaveLength(2);
    expect(result.topProducts[0].id).toBe("p1");
    expect(result.topProducts[0].revenue).toBe(150);
    expect(result.topProducts[0].quantity).toBe(3);
    expect(result.topProducts[0].lowStock).toBe(true);

    expect(result.topProducts[1].id).toBe("p2");
    expect(result.topProducts[1].revenue).toBe(25);
    expect(result.topProducts[1].lowStock).toBe(false);
  });

  it("gracefully handles empty states", async () => {
    mockTables = {
      businesses: [
        { name: "Empty Biz", currency_code: "USD", industry: "retail" },
      ],
      orders: [],
      inventory: [],
      suppliers: [],
      order_items: [],
    };

    const result = await getBrainData("biz-1");

    expect(result.currentRevenue).toBe(0);
    expect(result.previousRevenue).toBe(0);
    expect(result.revenueChange).toBeNull();
    expect(result.inventoryValue).toBe(0);
    expect(result.lowStock).toEqual([]);
    expect(result.supplierRisks).toEqual([]);
    expect(result.topProducts).toEqual([]);
  });
  it("accurately reports connected signals including actual active customers", async () => {
    mockTables = {
      businesses: [
        { name: "Test Biz", currency_code: "USD", industry: "retail" },
      ],
      orders: [],
      inventory: [],
      suppliers: [],
      order_items: [],
      customers: { _count: 1 },
    };
    let result = await getBrainData("biz-1");
    expect(result.connectedSignals).toBe(1);

    mockTables.customers = { _count: 0 };
    result = await getBrainData("biz-1");
    expect(result.connectedSignals).toBe(0);
  });
});
