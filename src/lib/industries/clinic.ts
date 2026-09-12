import type { IndustryConfig } from "./types"

export const clinicConfig: IndustryConfig = {
  id: "clinic",
  tier: 2,
  name: "Clinic / Dental",
  shortName: "Clinic",
  description: "Manage patient appointments, consultations, billing, and medical supplies for your clinic or dental practice.",
  icon: "Stethoscope",
  color: "bg-[#E8F8F5] text-[#1A6649]",

  terminology: {
    customer: { singular: "Patient", plural: "Patients" },
    product: { singular: "Service / Consultation", plural: "Services" },
    order: { singular: "Appointment", plural: "Appointments" },
    inventory: { singular: "Medical Supplies", plural: "Medical Supplies" },
    supplier: { singular: "Medical Supplier", plural: "Medical Suppliers" },
    staff: { singular: "Doctor / Specialist", plural: "Doctors" },
    revenueLabel: "Consultation Revenue",
    ordersLabel: "Appointments",
    averageOrderValueLabel: "Avg. Consultation Value",
    unitsLabel: "Services Rendered",
    customersLabel: "Patients",
    dashboardTagline: "Your clinic's performance overview.",
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
    operationsLabel: "Clinic Operations",
    operationsItems: [
      { label: "Billing / Checkout", href: "/pos", icon: "ShoppingCart" },
      { label: "Appointments", href: "/pos/orders", icon: "CalendarCheck" },
      { label: "Medical Supplies", href: "/pos/inventory", icon: "Boxes" },
      { label: "Services", href: "/pos/products", icon: "Stethoscope" },
      { label: "Purchases", href: "/pos/purchases", icon: "Truck" },
      { label: "Patients", href: "/pos/customers", icon: "UserCircle" },
      { label: "Expenses", href: "/pos/expenses", icon: "Wallet" },
      { label: "Suppliers", href: "/pos/suppliers", icon: "PackageSearch" },
    ],
  },

  alertTemplates: [
    {
      id: "inventory-pressure",
      titleTemplate: "Medical supplies are running low.",
      whyTemplate: "{{count}} supply items are at or below the reorder threshold.",
      actionTemplate: "Reorder supplies before they affect patient care.",
    },
    {
      id: "revenue-decline",
      titleTemplate: "Consultation revenue declined.",
      whyTemplate: "30-day billing is down {{pct}}% vs. last period.",
      actionTemplate: "Review appointment volume and outstanding payments.",
    },
  ],

  columnAliases: {
    customer: ["patient", "patient_name", "customer", "client"],
    product: ["service", "consultation", "treatment", "procedure", "service_name"],
    order: ["appointment_id", "appointment_number", "bill_id", "invoice_number"],
    revenue: ["revenue", "amount", "billing_amount", "consultation_fee", "total"],
    quantity: ["quantity", "qty", "sessions", "procedures", "count"],
    date: ["date", "appointment_date", "visit_date", "billing_date", "consultation_date"],
  },

  highlights: ["Patient billing via POS", "Appointment revenue tracking", "Medical supply management"],
}
