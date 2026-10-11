import { createClient } from "@/lib/supabase/server";
import { getIndustryConfig } from "@/lib/industries";

// Same date helpers as Phase 10
function addDays(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getBrainData(businessId: string) {
  const supabase = await createClient();

  // 1. Business Info
  const { data: business } = await supabase
    .from("businesses")
    .select("name, currency_code, industry")
    .eq("id", businessId)
    .single();

  if (!business) throw new Error("Business not found");

  // 2. Revenue & Orders
  const windowEnd = todayUTC();
  const windowStart = addDays(windowEnd, -29);
  const previousEnd = addDays(windowStart, -1);
  const previousStart = addDays(previousEnd, -29);

  const { data: allOrders } = await supabase
    .from("orders")
    .select("total_amount, order_date")
    .eq("business_id", businessId)
    .not("status", "in", '("draft","cancelled")')
    .gte("order_date", previousStart)
    .lte("order_date", windowEnd);

  const safeOrders = allOrders ?? [];

  let currentRevenue = 0;
  let currentGrossSales = 0;
  let currentReturns = 0;
  let currentOrdersCount = 0;

  let previousRevenue = 0;
  let previousGrossSales = 0;
  let previousReturns = 0;
  let previousOrdersCount = 0;

  for (const o of safeOrders) {
    const amt = Number(o.total_amount);
    const orderDate = o.order_date as string;
    const isCurrent = orderDate >= windowStart && orderDate <= windowEnd;
    const isPrevious = orderDate >= previousStart && orderDate <= previousEnd;

    if (isCurrent) {
      if (amt > 0) {
        currentGrossSales += amt;
        currentOrdersCount++;
      } else if (amt < 0) {
        currentReturns += Math.abs(amt);
      }
    } else if (isPrevious) {
      if (amt > 0) {
        previousGrossSales += amt;
        previousOrdersCount++;
      } else if (amt < 0) {
        previousReturns += Math.abs(amt);
      }
    }
  }

  currentRevenue = currentGrossSales - currentReturns;
  previousRevenue = previousGrossSales - previousReturns;
  const revenueChange =
    previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : null;
  const averageOrderValue =
    currentOrdersCount > 0 ? currentRevenue / currentOrdersCount : 0;

  // 3. Inventory
  const { data: inventory } = await supabase
    .from("inventory")
    .select(
      `
      product_id,
      quantity,
      reorder_level,
      unit_cost,
      product:products ( name, category )
    `,
    )
    .eq("business_id", businessId);

  const safeInventory = inventory ?? [];

  let inventoryValue = 0;
  const inventoryCount = safeInventory.length;
  const lowStock: {
    productId: string;
    productName: string;
    quantity: number;
    reorderLevel: number;
  }[] = [];

  for (const item of safeInventory) {
    const qty = Number(item.quantity);
    const cost = Number(item.unit_cost || 0);
    const reorder = Number(item.reorder_level || 0);

    inventoryValue += qty * cost;

    if (item.reorder_level !== null && qty <= reorder) {
      const product =
        (item.product as { name?: string; category?: string | null }) || {};
      lowStock.push({
        productId: item.product_id,
        productName: product.name || "Unknown Product",
        quantity: qty,
        reorderLevel: reorder,
      });
    }
  }

  // 4. Suppliers
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, name, reliability, average_lead_time, status")
    .eq("business_id", businessId);

  const safeSuppliers = suppliers ?? [];
  const suppliersCount = safeSuppliers.length;
  const supplierRisks = [];

  for (const s of safeSuppliers) {
    const leadTime =
      s.average_lead_time !== null ? Number(s.average_lead_time) : null;
    const reliability = s.reliability !== null ? Number(s.reliability) : null;
    const statusStr = String(s.status).toLowerCase();

    let riskScore = 0;
    if (leadTime !== null && leadTime >= 10) riskScore += 1;
    if (reliability !== null && reliability < 80) riskScore += 1;
    if (
      ["poor", "inactive", "watch", "risk", "delayed"].some((t) =>
        statusStr.includes(t),
      )
    )
      riskScore += 2;

    if (riskScore > 0) {
      supplierRisks.push({
        id: s.id,
        name: s.name,
        reliability,
        leadTime,
        riskScore,
      });
    }
  }

  supplierRisks.sort((a, b) => b.riskScore - a.riskScore);

  // 5. Top Products (Current Window)
  const { data: orderItems } = await supabase
    .from("order_items")
    .select(
      `
      product_id,
      quantity,
      total_amount,
      order:orders!inner(business_id, status, order_date),
      product:products(name, category)
    `,
    )
    .eq("order.business_id", businessId)
    .not("order.status", "in", '("draft","cancelled")')
    .gt("total_amount", 0) // Only original sales line items
    .gte("order.order_date", windowStart)
    .lte("order.order_date", windowEnd);

  const safeItems = orderItems ?? [];
  const productSales = new Map<
    string,
    { revenue: number; quantity: number; name: string; category: string | null }
  >();

  for (const item of safeItems) {
    if (!item.product_id) continue;
    const product =
      (item.product as { name?: string; category?: string | null }) || {};
    const amt = Number(item.total_amount || 0);
    const qty = Number(item.quantity || 0);

    const existing = productSales.get(item.product_id) ?? {
      revenue: 0,
      quantity: 0,
      name: product.name || "Unknown Product",
      category: product.category || null,
    };
    existing.revenue += amt;
    existing.quantity += qty;
    productSales.set(item.product_id, existing);
  }

  const topProducts = [...productSales.entries()]
    .map(([id, values]) => ({
      id,
      name: values.name,
      category: values.category,
      revenue: values.revenue,
      quantity: values.quantity,
      lowStock: lowStock.some((ls) => ls.productId === id),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // 6. Customers
  const { count: customersCount } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("is_active", true);

  const activeCustomersCount = customersCount || 0;

  let connectedSignals = 0;
  if (currentOrdersCount > 0) connectedSignals++;
  if (topProducts.length > 0) connectedSignals++;
  if (inventoryCount > 0) connectedSignals++;
  if (suppliersCount > 0) connectedSignals++;
  if (activeCustomersCount > 0) connectedSignals++;

  return {
    businessName: business.name || "Your business",
    currencyCode: business.currency_code || "INR",
    industryConfig: getIndustryConfig(business.industry),
    currentRevenue,
    previousRevenue,
    revenueChange,
    currentOrdersCount,
    previousOrdersCount,
    averageOrderValue,
    inventoryValue,
    inventoryCount,
    lowStock: lowStock
      .sort(
        (a, b) => b.reorderLevel - b.quantity - (a.reorderLevel - a.quantity),
      )
      .slice(0, 10),
    topProducts,
    supplierRisks: supplierRisks.slice(0, 5),
    suppliersCount,
    datasetsCount: 0,
    readyDatasetsCount: 0,
    connectedSignals,
    events: [],
    recommendations: [],
  };
}
