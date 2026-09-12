import type { IndustryConfig } from "./types"

export const automotiveConfig: IndustryConfig = {
  id: "automotive",
  tier: 2,
  name: "Automobile Service",
  shortName: "Auto Service",
  description: "Manage service jobs, vehicle records, parts inventory, and technician billing for your auto workshop or dealership.",
  icon: "Car",
  color: "bg-[#F0F4FF] text-[#1A2B7A]",

  terminology: {
    customer: { singular: "Customer", plural: "Customers" },
    product: { singular: "Service / Part", plural: "Services & Parts" },
    order: { singular: "Service Job", plural: "Service Jobs" },
    inventory: { singular: "Parts Inventory", plural: "Parts Inventory" },
    supplier: { singular: "Parts Supplier", plural: "Parts Suppliers" },
    staff: { singular: "Technician", plural: "Technicians" },
    revenueLabel: "Service Revenue",
    ordersLabel: "Service Jobs",
    averageOrderValueLabel: "Avg. Job Value",
    unitsLabel: "Parts Used",
    customersLabel: "Customers",
    dashboardTagline: "Workshop performance at a glance.",
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
    operationsLabel: "Workshop",
    operationsItems: [
      { label: "Billing / Checkout", href: "/pos", icon: "ShoppingCart" },
      { label: "Service Jobs", href: "/pos/orders", icon: "Receipt" },
      { label: "Parts Inventory", href: "/pos/inventory", icon: "Boxes" },
      { label: "Services & Parts", href: "/pos/products", icon: "Car" },
      { label: "Purchases", href: "/pos/purchases", icon: "Truck" },
      { label: "Customers", href: "/pos/customers", icon: "UserCircle" },
      { label: "Expenses", href: "/pos/expenses", icon: "Wallet" },
      { label: "Parts Suppliers", href: "/pos/suppliers", icon: "PackageSearch" },
    ],
  },

  alertTemplates: [
    {
      id: "inventory-pressure",
      titleTemplate: "Parts inventory is running low.",
      whyTemplate: "{{count}} parts are at or below the reorder level.",
      actionTemplate: "Reorder parts to prevent service job delays.",
    },
    {
      id: "revenue-decline",
      titleTemplate: "Service revenue declined.",
      whyTemplate: "30-day service billing is down {{pct}}% vs. last period.",
      actionTemplate: "Review job volume, technician utilization, and parts margins.",
    },
  ],

  columnAliases: {
    customer: ["customer", "customer_name", "vehicle_owner", "client"],
    product: ["service", "service_name", "part", "part_name", "repair_type", "job_type"],
    order: ["job_id", "service_order_id", "order_number", "work_order", "invoice_number"],
    revenue: ["revenue", "amount", "labour_charge", "parts_cost", "total_bill", "service_charge"],
    quantity: ["quantity", "qty", "parts_used", "hours", "count"],
    date: ["date", "service_date", "job_date", "delivery_date", "invoice_date"],
  },

  highlights: ["Service job billing via POS", "Parts inventory & reorder alerts", "Customer vehicle history"],
}
