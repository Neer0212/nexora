import type { IndustryConfig } from "./types"

export const hospitalityConfig: IndustryConfig = {
  id: "hospitality",
  tier: 2,
  name: "Hotel / Hospitality",
  shortName: "Hospitality",
  description: "Manage room reservations, guest billing, amenities, and hotel inventory for your hotel, resort, or guesthouse.",
  icon: "Hotel",
  color: "bg-[#FFF8E8] text-[#8B6914]",

  terminology: {
    customer: { singular: "Guest", plural: "Guests" },
    product: { singular: "Room / Service", plural: "Rooms & Services" },
    order: { singular: "Reservation", plural: "Reservations" },
    inventory: { singular: "Amenities & Supplies", plural: "Amenities & Supplies" },
    supplier: { singular: "Service Vendor", plural: "Service Vendors" },
    staff: { singular: "Staff Member", plural: "Staff" },
    revenueLabel: "Room Revenue",
    ordersLabel: "Reservations",
    averageOrderValueLabel: "Avg. Stay Value",
    unitsLabel: "Nights / Covers",
    customersLabel: "Guests",
    dashboardTagline: "Your property's performance.",
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
    operationsLabel: "Property Operations",
    operationsItems: [
      { label: "Guest Billing", href: "/pos", icon: "ShoppingCart" },
      { label: "Reservations", href: "/pos/orders", icon: "Receipt" },
      { label: "Supplies", href: "/pos/inventory", icon: "Boxes" },
      { label: "Rooms & Services", href: "/pos/products", icon: "Hotel" },
      { label: "Purchases", href: "/pos/purchases", icon: "Truck" },
      { label: "Guests", href: "/pos/customers", icon: "UserCircle" },
      { label: "Expenses", href: "/pos/expenses", icon: "Wallet" },
      { label: "Vendors", href: "/pos/suppliers", icon: "PackageSearch" },
    ],
  },

  alertTemplates: [
    {
      id: "inventory-pressure",
      titleTemplate: "Hotel supplies are running low.",
      whyTemplate: "{{count}} amenity or supply items are below the reorder level.",
      actionTemplate: "Restock before occupancy peaks.",
    },
    {
      id: "revenue-decline",
      titleTemplate: "Room revenue declined.",
      whyTemplate: "30-day room revenue is down {{pct}}% vs. last period.",
      actionTemplate: "Review occupancy rate, pricing, and reservation volume.",
    },
  ],

  columnAliases: {
    customer: ["guest", "guest_name", "customer", "visitor", "traveller"],
    product: ["room", "room_type", "room_number", "service", "package", "amenity"],
    order: ["reservation_id", "booking_id", "folio_number", "invoice_number", "stay_id"],
    revenue: ["revenue", "amount", "room_rate", "total_bill", "tariff", "accommodation_charge"],
    quantity: ["quantity", "qty", "nights", "pax", "occupancy", "count"],
    date: ["date", "check_in", "check_out", "reservation_date", "arrival_date", "departure_date"],
  },

  highlights: ["Guest billing via POS", "Room revenue & occupancy tracking", "Supply & vendor management"],
}
