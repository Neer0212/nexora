import type { IndustryConfig } from "./types"

export const educationConfig: IndustryConfig = {
  id: "education",
  tier: 2,
  name: "Education / Coaching",
  shortName: "Education",
  description: "Manage students, courses, fee collection, attendance, and teachers for your school, coaching center, or training institute.",
  icon: "GraduationCap",
  color: "bg-[#F5EDFF] text-[#6B21A8]",

  terminology: {
    customer: { singular: "Student", plural: "Students" },
    product: { singular: "Course / Batch", plural: "Courses" },
    order: { singular: "Enrollment / Fee Payment", plural: "Fee Payments" },
    inventory: { singular: "Academic Materials", plural: "Academic Materials" },
    supplier: { singular: "Educational Supplier", plural: "Suppliers" },
    staff: { singular: "Teacher / Instructor", plural: "Teachers" },
    revenueLabel: "Tuition Fees",
    ordersLabel: "Fee Payments",
    averageOrderValueLabel: "Avg. Fee Amount",
    unitsLabel: "Enrollments",
    customersLabel: "Students",
    dashboardTagline: "Your institute, on one screen.",
  },

  modules: {
    pos: "enabled",
    inventory: "available",
    finance: "enabled",
    brain: "enabled",
    investigate: "enabled",
    alerts: "enabled",
    goals: "enabled",
    forecasting: "enabled",
    dataHub: "enabled",
    customers: "enabled",
    products: "enabled",
    suppliers: "available",
    purchases: "available",
    expenses: "enabled",
  },

  primaryKPIs: ["revenue", "customersCount", "ordersCount", "averageOrderValue"],

  navigation: {
    operationsLabel: "Institute Operations",
    operationsItems: [
      { label: "Fee Collection", href: "/pos", icon: "ShoppingCart" },
      { label: "Fee Payments", href: "/pos/orders", icon: "Receipt" },
      { label: "Materials", href: "/pos/inventory", icon: "Boxes" },
      { label: "Courses", href: "/pos/products", icon: "GraduationCap" },
      { label: "Purchases", href: "/pos/purchases", icon: "Truck" },
      { label: "Students", href: "/pos/customers", icon: "UserCircle" },
      { label: "Expenses", href: "/pos/expenses", icon: "Wallet" },
      { label: "Suppliers", href: "/pos/suppliers", icon: "PackageSearch" },
    ],
  },

  alertTemplates: [
    {
      id: "inventory-pressure",
      titleTemplate: "Academic materials are running low.",
      whyTemplate: "{{count}} material items are below the reorder level.",
      actionTemplate: "Reorder before the next batch or academic term.",
    },
    {
      id: "revenue-decline",
      titleTemplate: "Fee collection declined.",
      whyTemplate: "30-day tuition fee collection is down {{pct}}% vs. last period.",
      actionTemplate: "Review outstanding fee payments and enrollment rates.",
    },
  ],

  columnAliases: {
    customer: ["student", "student_name", "learner", "customer", "candidate"],
    product: ["course", "course_name", "batch", "subject", "program", "class"],
    order: ["enrollment_id", "fee_payment_id", "admission_number", "roll_number", "invoice_number"],
    revenue: ["revenue", "amount", "tuition_fee", "fee_amount", "total_fee", "fee"],
    quantity: ["quantity", "qty", "sessions", "enrollments", "students_count"],
    date: ["date", "payment_date", "enrollment_date", "admission_date", "fee_date"],
  },

  highlights: ["Fee collection via POS", "Student enrollment tracking", "Course revenue analytics"],
}
