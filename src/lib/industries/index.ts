/**
 * Nexora — Industries Module
 * Central entry point for all industry configuration.
 */

export type {
  IndustryId,
  IndustryTier,
  IndustryConfig,
  TerminologyConfig,
  ModuleStatus,
  ModuleAccessConfig,
  KPIFormat,
  KPIKey,
  KPIConfig,
  NavItemConfig,
  NavSectionConfig,
  IndustryNavigationConfig,
  AlertTemplateConfig,
  ColumnAliasConfig,
} from "./types"

export {
  getIndustryConfig,
  getAllIndustries,
  getTier1Industries,
  getTier2Industries,
  getGeneralConfig,
  getIndustryTerminology,
  getIndustryColumnAliases,
  isValidIndustryId,
  getIndustryTier,
} from "./registry"
