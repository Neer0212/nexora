/**
 * Nexora — Industry Configuration Registry
 *
 * Single source of truth for all industry lookups, resolutions, and
 * terminology retrieval. Import this module rather than individual
 * industry files throughout the codebase.
 */

import type { IndustryId, IndustryConfig, TerminologyConfig, IndustryTier } from "./types"
import { generalConfig } from "./general"
import { retailConfig } from "./retail"
import { restaurantConfig } from "./restaurant"
import { salonConfig } from "./salon"
import { gymConfig } from "./gym"
import { clinicConfig } from "./clinic"
import { automotiveConfig } from "./automotive"
import { educationConfig } from "./education"
import { hospitalityConfig } from "./hospitality"

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const REGISTRY: Record<IndustryId, IndustryConfig> = {
  general: generalConfig,
  retail: retailConfig,
  restaurant: restaurantConfig,
  salon: salonConfig,
  gym: gymConfig,
  clinic: clinicConfig,
  automotive: automotiveConfig,
  education: educationConfig,
  hospitality: hospitalityConfig,
}

/** All industry IDs in display order (Tier 1 first, then Tier 2, then general) */
const ORDERED_IDS: IndustryId[] = [
  "retail",
  "restaurant",
  "salon",
  "gym",
  "clinic",
  "automotive",
  "education",
  "hospitality",
  "general",
]

// ---------------------------------------------------------------------------
// ID Normalization
// ---------------------------------------------------------------------------

function normalizeId(raw: string | null | undefined): IndustryId {
  if (!raw) return "general"
  const cleaned = raw.toLowerCase().trim().replace(/[^a-z]/g, "")
  if (cleaned in REGISTRY) return cleaned as IndustryId
  return "general"
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolve an IndustryConfig from any raw string value.
 * Returns "general" for null, undefined, empty, or unrecognized values.
 */
export function getIndustryConfig(industryId?: string | null): IndustryConfig {
  return REGISTRY[normalizeId(industryId)]
}

/**
 * Get all industry configs in canonical display order.
 */
export function getAllIndustries(): IndustryConfig[] {
  return ORDERED_IDS.map((id) => REGISTRY[id])
}

/**
 * Get only Tier 1 industries.
 */
export function getTier1Industries(): IndustryConfig[] {
  return getAllIndustries().filter((config) => config.tier === 1)
}

/**
 * Get only Tier 2 industries.
 */
export function getTier2Industries(): IndustryConfig[] {
  return getAllIndustries().filter((config) => config.tier === 2)
}

/**
 * Get the general fallback config.
 */
export function getGeneralConfig(): IndustryConfig {
  return REGISTRY["general"]
}

/**
 * Get terminology for a business — safely defaults to general.
 */
export function getIndustryTerminology(industryId?: string | null): TerminologyConfig {
  return getIndustryConfig(industryId).terminology
}

/**
 * Get all column aliases for a given industry.
 * Useful for dataset classification/import mapping.
 */
export function getIndustryColumnAliases(industryId?: string | null) {
  return getIndustryConfig(industryId).columnAliases
}

/**
 * Check whether a given string is a valid, registered IndustryId.
 */
export function isValidIndustryId(value: unknown): value is IndustryId {
  if (typeof value !== "string") return false
  const cleaned = value.toLowerCase().trim().replace(/[^a-z]/g, "")
  return cleaned in REGISTRY
}

/**
 * Get the tier for an industry.
 */
export function getIndustryTier(industryId?: string | null): IndustryTier {
  return getIndustryConfig(industryId).tier
}

// Re-export types for convenience
export type { IndustryId, IndustryConfig, TerminologyConfig }
