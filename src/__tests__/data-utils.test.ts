import { describe, it, expect } from "vitest"
import { text, num, norm, keyOf, parseDate, addDays, formatLabel, isCancelled, formatChange, formatCompact } from "@/lib/data-utils"

describe("text", () => {
  it("returns empty string for null", () => expect(text(null)).toBe(""))
  it("returns empty string for undefined", () => expect(text(undefined)).toBe(""))
  it("trims whitespace", () => expect(text("  hello  ")).toBe("hello"))
  it("converts number to string", () => expect(text(42)).toBe("42"))
})

describe("num", () => {
  it("returns number for number input", () => expect(num(42)).toBe(42))
  it("parses string number", () => expect(num("100")).toBe(100))
  it("strips currency symbols", () => expect(num("₹1,234")).toBe(1234))
  it("strips dollar sign", () => expect(num("$99.99")).toBe(99.99))
  it("strips euro sign", () => expect(num("€50")).toBe(50))
  it("strips percentage", () => expect(num("85%")).toBe(85))
  it("returns 0 for null", () => expect(num(null)).toBe(0))
  it("returns 0 for undefined", () => expect(num(undefined)).toBe(0))
  it("returns 0 for non-numeric string", () => expect(num("abc")).toBe(0))
  it("returns 0 for empty string", () => expect(num("")).toBe(0))
  it("handles negative numbers", () => expect(num(-42)).toBe(-42))
  it("returns 0 for NaN", () => expect(num(NaN)).toBe(0))
  it("returns 0 for Infinity", () => expect(num(Infinity)).toBe(0))
  it("strips commas in Indian notation", () => expect(num("12,45,000")).toBe(1245000))
  it("strips spaces", () => expect(num("1 234")).toBe(1234))
})

describe("norm", () => {
  it("lowercases", () => expect(norm("OrderDate")).toBe("orderdate"))
  it("strips underscores", () => expect(norm("order_date")).toBe("orderdate"))
  it("strips hyphens", () => expect(norm("order-date")).toBe("orderdate"))
  it("strips spaces", () => expect(norm("Order Date")).toBe("orderdate"))
})

describe("keyOf", () => {
  it("finds exact match", () => expect(keyOf({ revenue: 100 }, ["revenue"])).toBe("revenue"))
  it("finds normalized match", () => expect(keyOf({ "Order Date": "2024-01-01" }, ["order_date"])).toBe("Order Date"))
  it("returns first matching alias", () => expect(keyOf({ total: 100, amount: 200 }, ["revenue", "amount", "total"])).toBe("amount"))
  it("returns null if no match", () => expect(keyOf({ foo: 1 }, ["revenue", "sales"])).toBeNull())
  it("handles empty row", () => expect(keyOf({}, ["revenue"])).toBeNull())
})

describe("parseDate", () => {
  it("parses ISO date", () => expect(parseDate("2024-03-15")).toBe("2024-03-15"))
  it("pads single-digit month/day", () => expect(parseDate("2024-3-5")).toBe("2024-03-05"))
  it("handles ISO datetime", () => expect(parseDate("2024-03-15T12:00:00Z")).toBe("2024-03-15"))
  it("returns null for empty", () => expect(parseDate("")).toBeNull())
  it("returns null for null", () => expect(parseDate(null)).toBeNull())
  it("returns null for invalid", () => expect(parseDate("not-a-date")).toBeNull())
})

describe("addDays", () => {
  it("adds days", () => expect(addDays("2024-01-01", 5)).toBe("2024-01-06"))
  it("subtracts days", () => expect(addDays("2024-01-10", -5)).toBe("2024-01-05"))
  it("handles month boundary", () => expect(addDays("2024-01-31", 1)).toBe("2024-02-01"))
})

describe("formatLabel", () => {
  it("formats date label", () => {
    const label = formatLabel("2024-03-15")
    expect(label).toBeDefined()
    expect(typeof label).toBe("string")
  })
})

describe("isCancelled", () => {
  it("detects cancelled", () => expect(isCancelled("cancelled")).toBe(true))
  it("detects canceled (US)", () => expect(isCancelled("canceled")).toBe(true))
  it("detects returned", () => expect(isCancelled("returned")).toBe(true))
  it("detects refunded", () => expect(isCancelled("refunded")).toBe(true))
  it("case insensitive", () => expect(isCancelled("CANCELLED")).toBe(true))
  it("returns false for completed", () => expect(isCancelled("completed")).toBe(false))
  it("returns false for empty", () => expect(isCancelled("")).toBe(false))
})

describe("formatChange", () => {
  it("formats positive change", () => expect(formatChange(12.4)).toBe("↑ 12.4%"))
  it("formats negative change", () => expect(formatChange(-8.2)).toBe("↓ 8.2%"))
  it("formats zero change", () => expect(formatChange(0)).toBe("→ 0.0%"))
  it("formats null", () => expect(formatChange(null)).toBe("—"))
})

describe("formatCompact", () => {
  it("formats INR numbers", () => {
    expect(formatCompact(1200, "INR")).toBe("1.2K")
    expect(formatCompact(150000, "INR")).toBe("1.5L")
    expect(formatCompact(25000000, "INR")).toBe("2.5Cr")
  })
  it("formats USD numbers", () => {
    expect(formatCompact(1200, "USD")).toBe("1.2K")
    expect(formatCompact(1500000, "USD")).toBe("1.5M")
    expect(formatCompact(2500000000, "USD")).toBe("2.5B")
  })
})
