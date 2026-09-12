import type { IndustryConfig } from "./types"

export const retailConfig: IndustryConfig = {
  id: "retail",
  tier: 1,
  name: "Retail / Local Store",
  shortName: "Retail",
  description: "Manage products, inventory, POS sales, and customers for a retail or local store.",
  icon: "Store",
  color: "bg-[#EAF5F0] text-[#286B54]",

  terminology: {
    customer: { singular: "Customer", plural: "Customers" },
    product: { singular: "Product", plural: "Products" },
    order: { singular: "Sale", plural: "Sales" },
    inventory: { singular: "Stock", plural: "Stock" },
    supplier: { singular: "Supplier", plural: "Suppliers" },
    staff: { singular: "Staff Member", plural: "Staff" },
    revenueLabel: "Revenue",
    ordersLabel: "Completed Sales",
    averageOrderValueLabel: "Avg. Sale Value",
    unitsLabel: "Units Sold",
    customersLabel: "Customers",
    dashboardTagline: "Your store, at a glance.",
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
    operationsLabel: "Point of Sale",
    operationsItems: [
      { label: "Checkout", href: "/pos", icon: "ShoppingCart" },
      { label: "Sales", href: "/pos/orders", icon: "Receipt" },
      { label: "Stock", href: "/pos/inventory", icon: "Boxes" },
      { label: "Products", href: "/pos/products", icon: "Store" },
      { label: "Purchases", href: "/pos/purchases", icon: "Truck" },
      { label: "Customers", href: "/pos/customers", icon: "UserCircle" },
      { label: "Expenses", href: "/pos/expenses", icon: "Wallet" },
      { label: "Suppliers", href: "/pos/suppliers", icon: "PackageSearch" },
    ],
  },

  alertTemplates: [
    {
      id: "inventory-pressure",
      titleTemplate: "Stock is running low.",
      whyTemplate: "{{count}} products are at or below reorder level.",
      actionTemplate: "Reorder from your suppliers before stock-outs occur.",
    },
    {
      id: "revenue-decline",
      titleTemplate: "Sales revenue declined.",
      whyTemplate: "30-day sales are down {{pct}}% vs. last period.",
      actionTemplate: "Review product performance and top customer activity.",
    },
  ],

  columnAliases: {
    customer: ["customer", "customer_name", "client", "buyer", "shopper"],
    product: ["product", "product_name", "item", "sku", "barcode", "description"],
    order: ["order_id", "order_number", "invoice_number", "receipt_number", "transaction_id"],
    revenue: ["revenue", "amount", "total", "total_amount", "sales", "price", "net_sales"],
    quantity: ["quantity", "qty", "units", "items_sold", "count"],
    date: ["date", "order_date", "sale_date", "transaction_date", "created_at"],
  },

  highlights: ["POS & barcode scanning", "Stock & reorder alerts", "Supplier management"],
}
