import type { IndustryConfig } from "./types"

export const generalConfig: IndustryConfig = {
  id: "general",
  tier: "general",
  name: "Other / General Business",
  shortName: "General",
  description: "A flexible business workspace that works for any kind of operation.",
  icon: "Building2",
  color: "bg-[#F0EEF6] text-[#433D8B]",

  terminology: {
    customer: { singular: "Customer", plural: "Customers" },
    product: { singular: "Product", plural: "Products" },
    order: { singular: "Order", plural: "Orders" },
    inventory: { singular: "Inventory", plural: "Inventory" },
    supplier: { singular: "Supplier", plural: "Suppliers" },
    staff: { singular: "Staff Member", plural: "Staff" },
    revenueLabel: "Revenue",
    ordersLabel: "Orders",
    averageOrderValueLabel: "Avg. Order Value",
    unitsLabel: "Units Sold",
    customersLabel: "Customers",
    dashboardTagline: "See what's happening.",
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

  primaryKPIs: ["revenue", "ordersCount", "averageOrderValue", "customersCount"],

  navigation: {
    operationsLabel: "Operations (POS)",
    operationsItems: [
      { label: "Checkout", href: "/pos", icon: "ShoppingCart" },
      { label: "Orders", href: "/pos/orders", icon: "Receipt" },
      { label: "Inventory", href: "/pos/inventory", icon: "Boxes" },
      { label: "Catalogue", href: "/pos/products", icon: "Store" },
      { label: "Purchases", href: "/pos/purchases", icon: "Truck" },
      { label: "Customers", href: "/pos/customers", icon: "UserCircle" },
      { label: "Expenses", href: "/pos/expenses", icon: "Wallet" },
      { label: "Suppliers", href: "/pos/suppliers", icon: "PackageSearch" },
    ],
  },

  alertTemplates: [
    {
      id: "inventory-pressure",
      titleTemplate: "Inventory pressure is building.",
      whyTemplate: "{{count}} products are at or below the reorder threshold.",
      actionTemplate: "Review and replenish affected products.",
    },
    {
      id: "revenue-decline",
      titleTemplate: "Revenue has declined materially.",
      whyTemplate: "30-day revenue is down {{pct}}% versus the prior period.",
      actionTemplate: "Investigate product, channel, and customer drivers.",
    },
  ],

  columnAliases: {
    customer: ["customer", "customer_name", "client", "client_name", "account", "buyer"],
    product: ["product", "product_name", "item", "sku", "description"],
    order: ["order_id", "order_number", "transaction_id", "invoice_number"],
    revenue: ["revenue", "amount", "total", "total_amount", "sales", "price"],
    quantity: ["quantity", "qty", "units", "count"],
    date: ["date", "order_date", "transaction_date", "created_at", "sale_date"],
  },

  highlights: ["Flexible workspace", "All modules available", "Universal data import"],
}
