import { describe, it, expect } from "vitest"
import { 
  getIndustryConfig, 
  getAllIndustries, 
  getTier1Industries, 
  getTier2Industries,
  getIndustryTerminology,
  getIndustryColumnAliases,
  isValidIndustryId,
  getIndustryTier
} from "../src/lib/industries/registry"

describe("Industry Engine", () => {
  it("resolves valid industries case-insensitively", () => {
    const retail = getIndustryConfig("Retail")
    expect(retail.id).toBe("retail")
    expect(retail.tier).toBe(1)

    const salon = getIndustryConfig(" SALON ")
    expect(salon.id).toBe("salon")
  })

  it("falls back to general for unknown or null industries", () => {
    const unknown = getIndustryConfig("software")
    expect(unknown.id).toBe("general")
    
    const fromNull = getIndustryConfig(null)
    expect(fromNull.id).toBe("general")
  })

  it("validates industry IDs correctly", () => {
    expect(isValidIndustryId("retail")).toBe(true)
    expect(isValidIndustryId("gym")).toBe(true)
    expect(isValidIndustryId("general")).toBe(true)
    expect(isValidIndustryId("software")).toBe(false)
  })

  it("determines tiers correctly", () => {
    expect(getIndustryTier("restaurant")).toBe(1)
    expect(getIndustryTier("automotive")).toBe(2)
    expect(getIndustryTier("general")).toBe("general")
    expect(getIndustryTier("unknown")).toBe("general")
  })

  it("returns correct registry collections", () => {
    const all = getAllIndustries()
    expect(all.length).toBeGreaterThan(0)
    expect(all.find(i => i.id === "general")).toBeDefined()

    const tier1 = getTier1Industries()
    expect(tier1.every(i => i.tier === 1)).toBe(true)
    expect(tier1.find(i => i.id === "retail")).toBeDefined()

    const tier2 = getTier2Industries()
    expect(tier2.every(i => i.tier === 2)).toBe(true)
    expect(tier2.find(i => i.id === "automotive")).toBeDefined()
  })

  it("provides industry-aware terminology", () => {
    const retailTerms = getIndustryTerminology("retail")
    expect(retailTerms.product.singular).toBe("Product")
    expect(retailTerms.order.singular).toBe("Sale")

    const gymTerms = getIndustryTerminology("gym")
    expect(gymTerms.customer.singular).toBe("Member")
    
    const clinicTerms = getIndustryTerminology("clinic")
    expect(clinicTerms.customer.singular).toBe("Patient")
  })

  it("provides column aliases for Data Hub", () => {
    const restaurantAliases = getIndustryColumnAliases("restaurant")
    expect(restaurantAliases.product.includes("menu_item")).toBe(true)
    
    const clinicAliases = getIndustryColumnAliases("clinic")
    expect(clinicAliases.customer.includes("patient")).toBe(true)
  })

  it("defines modular access and nav config properly", () => {
    const gym = getIndustryConfig("gym")
    expect(gym.modules.pos).toBe("enabled")
    expect(gym.navigation.operationsItems.some(i => i.href === "/pos")).toBe(true)
  })
})
