import type { IndustryConfig } from "./types"

export const gymConfig: IndustryConfig = {
  id: "gym",
  tier: 1,
  name: "Gym / Fitness",
  shortName: "Gym",
  description: "Manage memberships, classes, trainers, and retail for your gym or fitness studio.",
  icon: "Dumbbell",
  color: "bg-[#E8F4FD] text-[#1A5276]",

  terminology: {
    customer: { singular: "Member", plural: "Members" },
    product: { singular: "Membership Plan", plural: "Membership Plans" },
    order: { singular: "Membership Payment", plural: "Membership Payments" },
    inventory: { singular: "Equipment / Supplies", plural: "Equipment & Supplies" },
    supplier: { singular: "Equipment Vendor", plural: "Equipment Vendors" },
    staff: { singular: "Trainer", plural: "Trainers" },
    revenueLabel: "Membership Revenue",
    ordersLabel: "Active Memberships",
    averageOrderValueLabel: "Avg. Plan Value",
    unitsLabel: "Sessions / Classes",
    customersLabel: "Members",
    dashboardTagline: "Your gym's health check.",
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

  primaryKPIs: ["revenue", "customersCount", "averageOrderValue", "ordersCount"],

  navigation: {
    operationsLabel: "Gym Operations",
    operationsItems: [
      { label: "Billing / Checkout", href: "/pos", icon: "ShoppingCart" },
      { label: "Payments", href: "/pos/orders", icon: "Receipt" },
      { label: "Equipment", href: "/pos/inventory", icon: "Boxes" },
      { label: "Plans & Services", href: "/pos/products", icon: "Dumbbell" },
      { label: "Purchases", href: "/pos/purchases", icon: "Truck" },
      { label: "Members", href: "/pos/customers", icon: "UserCircle" },
      { label: "Expenses", href: "/pos/expenses", icon: "Wallet" },
      { label: "Vendors", href: "/pos/suppliers", icon: "PackageSearch" },
    ],
  },

  alertTemplates: [
    {
      id: "inventory-pressure",
      titleTemplate: "Equipment supplies are running low.",
      whyTemplate: "{{count}} supply items are at or below reorder level.",
      actionTemplate: "Reorder to prevent disruption to classes and training.",
    },
    {
      id: "revenue-decline",
      titleTemplate: "Membership revenue declined.",
      whyTemplate: "30-day membership revenue is down {{pct}}% vs. last period.",
      actionTemplate: "Review membership renewals and new member acquisition.",
    },
  ],

  columnAliases: {
    customer: ["member", "member_name", "customer", "client", "subscriber"],
    product: ["membership_plan", "plan", "package", "class", "session_type"],
    order: ["membership_id", "payment_id", "subscription_id", "order_id"],
    revenue: ["revenue", "amount", "membership_fee", "subscription_amount", "total"],
    quantity: ["quantity", "qty", "sessions", "classes", "renewals"],
    date: ["date", "payment_date", "membership_date", "enrollment_date", "start_date", "expiry_date"],
  },

  highlights: ["Membership billing via POS", "Member retention tracking", "Class & trainer management"],
}
