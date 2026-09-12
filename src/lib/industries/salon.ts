import type { IndustryConfig } from "./types"

export const salonConfig: IndustryConfig = {
  id: "salon",
  tier: 1,
  name: "Salon / Spa",
  shortName: "Salon",
  description: "Run your beauty salon, spa, or wellness studio with service bookings, client management, and product retail.",
  icon: "Scissors",
  color: "bg-[#FDE8F5] text-[#8D3F7A]",

  terminology: {
    customer: { singular: "Client", plural: "Clients" },
    product: { singular: "Service", plural: "Services" },
    order: { singular: "Appointment", plural: "Appointments" },
    inventory: { singular: "Supplies", plural: "Supplies" },
    supplier: { singular: "Supplier", plural: "Suppliers" },
    staff: { singular: "Stylist / Therapist", plural: "Staff" },
    revenueLabel: "Service Revenue",
    ordersLabel: "Appointments",
    averageOrderValueLabel: "Avg. Service Value",
    unitsLabel: "Services Rendered",
    customersLabel: "Clients",
    dashboardTagline: "Your salon, on one screen.",
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
    operationsLabel: "Salon Operations",
    operationsItems: [
      { label: "Billing / Checkout", href: "/pos", icon: "ShoppingCart" },
      { label: "Appointments", href: "/pos/orders", icon: "CalendarCheck" },
      { label: "Supplies", href: "/pos/inventory", icon: "Boxes" },
      { label: "Services", href: "/pos/products", icon: "Scissors" },
      { label: "Purchases", href: "/pos/purchases", icon: "Truck" },
      { label: "Clients", href: "/pos/customers", icon: "UserCircle" },
      { label: "Expenses", href: "/pos/expenses", icon: "Wallet" },
      { label: "Suppliers", href: "/pos/suppliers", icon: "PackageSearch" },
    ],
  },

  alertTemplates: [
    {
      id: "inventory-pressure",
      titleTemplate: "Salon supplies are running low.",
      whyTemplate: "{{count}} supply items are below the reorder level.",
      actionTemplate: "Reorder supplies before they affect service quality.",
    },
    {
      id: "revenue-decline",
      titleTemplate: "Service revenue declined.",
      whyTemplate: "30-day service revenue is down {{pct}}% vs. last period.",
      actionTemplate: "Review appointment volume and client retention.",
    },
  ],

  columnAliases: {
    customer: ["client", "client_name", "customer", "guest", "member"],
    product: ["service", "service_name", "treatment", "package", "product"],
    order: ["appointment_id", "booking_id", "appointment_number", "order_id"],
    revenue: ["revenue", "amount", "service_charge", "total", "payment_amount"],
    quantity: ["quantity", "qty", "sessions", "count"],
    date: ["date", "appointment_date", "booking_date", "service_date", "visit_date"],
  },

  highlights: ["Appointment billing via POS", "Client history & retention", "Supplies inventory tracking"],
}
