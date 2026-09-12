import type { IndustryConfig } from "./types"

export const restaurantConfig: IndustryConfig = {
  id: "restaurant",
  tier: 1,
  name: "Restaurant / Café",
  shortName: "Restaurant",
  description: "Run your restaurant, café, or cloud kitchen with menu management, kitchen inventory, and table orders.",
  icon: "UtensilsCrossed",
  color: "bg-[#FEF3E2] text-[#9A5D00]",

  terminology: {
    customer: { singular: "Guest", plural: "Guests" },
    product: { singular: "Menu Item", plural: "Menu Items" },
    order: { singular: "Order", plural: "Orders" },
    inventory: { singular: "Kitchen Stock", plural: "Kitchen Stock" },
    supplier: { singular: "Food Vendor", plural: "Food Vendors" },
    staff: { singular: "Team Member", plural: "Team" },
    revenueLabel: "Sales",
    ordersLabel: "Orders Served",
    averageOrderValueLabel: "Avg. Order Value",
    unitsLabel: "Items Served",
    customersLabel: "Guests",
    dashboardTagline: "What's moving in your restaurant.",
  },

  modules: {
    pos: "enabled",
    inventory: "enabled",
    finance: "enabled",
    brain: "enabled",
    investigate: "enabled",
    alerts: "enabled",
    goals: "enabled",
    forecasting: "enabled",
    dataHub: "enabled",
    customers: "enabled",
    products: "enabled",
    suppliers: "enabled",
    purchases: "enabled",
    expenses: "enabled",
  },

  primaryKPIs: ["revenue", "ordersCount", "averageOrderValue", "lowStockCount"],

  navigation: {
    operationsLabel: "Restaurant",
    operationsItems: [
      { label: "POS / Billing", href: "/pos", icon: "ShoppingCart" },
      { label: "Orders", href: "/pos/orders", icon: "Receipt" },
      { label: "Kitchen Stock", href: "/pos/inventory", icon: "Boxes" },
      { label: "Menu", href: "/pos/products", icon: "UtensilsCrossed" },
      { label: "Purchases", href: "/pos/purchases", icon: "Truck" },
      { label: "Guests", href: "/pos/customers", icon: "UserCircle" },
      { label: "Expenses", href: "/pos/expenses", icon: "Wallet" },
      { label: "Food Vendors", href: "/pos/suppliers", icon: "PackageSearch" },
    ],
  },

  alertTemplates: [
    {
      id: "inventory-pressure",
      titleTemplate: "Kitchen ingredient stock is low.",
      whyTemplate: "{{count}} ingredients are below the reorder level.",
      actionTemplate: "Contact your food vendors before service is impacted.",
    },
    {
      id: "revenue-decline",
      titleTemplate: "Restaurant sales declined.",
      whyTemplate: "30-day sales are down {{pct}}% vs. last period.",
      actionTemplate: "Review best-selling menu items and table activity.",
    },
  ],

  columnAliases: {
    customer: ["guest", "guest_name", "customer", "diner", "table_number", "table"],
    product: ["menu_item", "item", "dish", "product", "menu_category", "description"],
    order: ["order_id", "order_number", "table_order", "ticket_number", "bill_number"],
    revenue: ["revenue", "amount", "total", "bill_total", "sales", "food_sales"],
    quantity: ["quantity", "qty", "portions", "covers", "count"],
    date: ["date", "order_date", "service_date", "transaction_date", "billing_date"],
  },

  highlights: ["Menu & order management", "Kitchen inventory tracking", "Table billing via POS"],
}
