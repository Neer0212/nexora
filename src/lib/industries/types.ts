/**
 * Nexora — Industry Configuration Types
 * Single source of truth for all industry-specific type definitions.
 */

// ---------------------------------------------------------------------------
// Industry IDs
// ---------------------------------------------------------------------------

export type IndustryId =
  | "retail"
  | "restaurant"
  | "salon"
  | "gym"
  | "clinic"
  | "automotive"
  | "education"
  | "hospitality"
  | "general"

export type IndustryTier = 1 | 2 | "general"

// ---------------------------------------------------------------------------
// Terminology
// ---------------------------------------------------------------------------

export type TerminologyConfig = {
  /** Primary entity that buys/uses your service */
  customer: { singular: string; plural: string }
  /** Primary item being sold or offered */
  product: { singular: string; plural: string }
  /** A transaction or booking */
  order: { singular: string; plural: string }
  /** Stock of items */
  inventory: { singular: string; plural: string }
  /** Source/vendor of supplies */
  supplier: { singular: string; plural: string }
  /** Staff member */
  staff: { singular: string; plural: string }

  // Metric label overrides
  revenueLabel: string
  ordersLabel: string
  averageOrderValueLabel: string
  unitsLabel: string
  customersLabel: string

  // Dashboard heading
  dashboardTagline: string
}

// ---------------------------------------------------------------------------
// Module access levels
// ---------------------------------------------------------------------------

export type ModuleStatus = "enabled" | "available" | "coming_soon" | "hidden"

export type ModuleAccessConfig = {
  pos: ModuleStatus
  inventory: ModuleStatus
  finance: ModuleStatus
  brain: ModuleStatus
  investigate: ModuleStatus
  alerts: ModuleStatus
  goals: ModuleStatus
  forecasting: ModuleStatus
  dataHub: ModuleStatus
  customers: ModuleStatus
  products: ModuleStatus
  suppliers: ModuleStatus
  purchases: ModuleStatus
  expenses: ModuleStatus
}

// ---------------------------------------------------------------------------
// KPI Configuration
// ---------------------------------------------------------------------------

export type KPIFormat = "currency" | "compactCurrency" | "number" | "percentage"
export type KPIKey =
  | "revenue"
  | "ordersCount"
  | "averageOrderValue"
  | "unitsSold"
  | "customersCount"
  | "grossProfit"
  | "lowStockCount"
  | "inventoryValue"
  | "returnsCount"
  | "suppliersCount"

export type KPIConfig = {
  key: KPIKey
  label: string
  detailTemplate: string // "{{value}} {{context}}"
  format: KPIFormat
  icon: string // lucide icon name
  emptyLabel: string
}

// ---------------------------------------------------------------------------
// Navigation Configuration
// ---------------------------------------------------------------------------

export type NavItemConfig = {
  label: string
  href: string
  icon: string // lucide icon name
}

export type NavSectionConfig = {
  label: string
  items: NavItemConfig[]
}

export type IndustryNavigationConfig = {
  operationsLabel: string
  operationsItems: NavItemConfig[]
}

// ---------------------------------------------------------------------------
// Alert Templates
// ---------------------------------------------------------------------------

export type AlertTemplateConfig = {
  id: string
  titleTemplate: string
  whyTemplate: string
  actionTemplate: string
}

// ---------------------------------------------------------------------------
// Data Import Column Aliases
// ---------------------------------------------------------------------------

export type ColumnAliasConfig = {
  /** Column names that map to "customer" */
  customer: string[]
  /** Column names that map to "product" */
  product: string[]
  /** Column names that map to "order" / "transaction" */
  order: string[]
  /** Column names that map to "revenue" / "amount" */
  revenue: string[]
  /** Column names that map to "quantity" */
  quantity: string[]
  /** Column names that map to "date" */
  date: string[]
}

// ---------------------------------------------------------------------------
// Full Industry Configuration
// ---------------------------------------------------------------------------

export type IndustryConfig = {
  id: IndustryId
  tier: IndustryTier
  name: string
  shortName: string
  description: string
  icon: string // lucide icon name
  color: string // tailwind accent class for badge

  terminology: TerminologyConfig
  modules: ModuleAccessConfig
  primaryKPIs: KPIKey[] // ordered list of KPIs to show on dashboard (max 4)
  navigation: IndustryNavigationConfig
  alertTemplates: AlertTemplateConfig[]
  columnAliases: ColumnAliasConfig

  /** What makes this industry distinct — shown on onboarding card */
  highlights: string[]
}
