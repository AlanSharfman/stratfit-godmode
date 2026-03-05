import { describe, it, expect } from "vitest"
import { parseNaturalLanguage } from "@/engine/naturalLanguageForceMapper"

describe("parseNaturalLanguage", () => {
  it("returns empty forces for empty query", () => {
    const result = parseNaturalLanguage("")
    expect(result.confidence).toBe(0)
    expect(Object.keys(result.forces)).toHaveLength(0)
  })

  it("returns empty forces for gibberish", () => {
    const result = parseNaturalLanguage("xyzzy foobar qux")
    expect(result.confidence).toBe(0)
    expect(Object.keys(result.forces)).toHaveLength(0)
  })

  describe("keyword rules", () => {
    it("detects biggest client loss", () => {
      const result = parseNaturalLanguage("What if we lose our biggest client?")
      expect(result.confidence).toBeGreaterThanOrEqual(0.7)
      expect(result.forces.revenue).toBeLessThan(0)
      expect(result.forces.churn).toBeGreaterThan(0)
    })

    it("detects cost cutting", () => {
      const result = parseNaturalLanguage("What if we cut costs by 30%?")
      expect(result.confidence).toBeGreaterThanOrEqual(0.7)
      expect(result.forces.burn).toBeLessThan(0)
    })

    it("detects doubling marketing", () => {
      const result = parseNaturalLanguage("What if we double marketing spend?")
      expect(result.confidence).toBeGreaterThanOrEqual(0.7)
      expect(result.forces.burn).toBeGreaterThan(0)
      expect(result.forces.growth).toBeGreaterThan(0)
    })

    it("detects price increase", () => {
      const result = parseNaturalLanguage("What if we raise prices?")
      expect(result.confidence).toBeGreaterThanOrEqual(0.7)
      expect(result.forces.revenue).toBeGreaterThan(0)
    })

    it("detects recession scenario", () => {
      const result = parseNaturalLanguage("What happens in a recession?")
      expect(result.confidence).toBeGreaterThanOrEqual(0.7)
      expect(result.forces.growth).toBeLessThan(0)
      expect(result.forces.revenue).toBeLessThan(0)
    })

    it("detects hiring scenario with count via keyword rule", () => {
      // "hire 5" triggers the hire keyword rule directly
      const result = parseNaturalLanguage("We should hire 5 people next quarter")
      expect(result.confidence).toBeGreaterThanOrEqual(0.7)
      expect(result.forces.burn).toBe(60_000) // 5 * 12_000
      expect(result.forces.growth).toBe(15)    // 5 * 3
    })

    it("detects layoffs", () => {
      const result = parseNaturalLanguage("What if we lay off half the team?")
      expect(result.confidence).toBeGreaterThanOrEqual(0.7)
      expect(result.forces.burn).toBeLessThan(0)
      expect(result.forces.growth).toBeLessThan(0)
    })

    it("detects automation/AI", () => {
      const result = parseNaturalLanguage("What if we implement AI for customer support?")
      expect(result.confidence).toBeGreaterThanOrEqual(0.7)
      expect(result.forces.efficiency).toBeGreaterThan(0)
    })

    it("detects churn increase", () => {
      const result = parseNaturalLanguage("What if churn increases?")
      expect(result.confidence).toBeGreaterThanOrEqual(0.7)
      expect(result.forces.churn).toBeGreaterThan(0)
    })

    it("detects competitive exit", () => {
      const result = parseNaturalLanguage("What if our main competitor shuts down?")
      expect(result.confidence).toBeGreaterThanOrEqual(0.7)
      expect(result.forces.growth).toBeGreaterThan(0)
    })
  })

  describe("quantitative extraction", () => {
    it("extracts dollar amounts for revenue", () => {
      const result = parseNaturalLanguage("What if revenue drops 20%?")
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.forces.revenue).toBeLessThan(0)
    })

    it("extracts negative sentiment", () => {
      const result = parseNaturalLanguage("What if growth declines?")
      expect(result.confidence).toBeGreaterThan(0)
      const total = Object.values(result.forces).reduce((s, v) => s + (v ?? 0), 0)
      expect(total).toBeLessThan(0)
    })

    it("extracts positive sentiment", () => {
      const result = parseNaturalLanguage("What if growth improves significantly?")
      expect(result.confidence).toBeGreaterThan(0)
      const total = Object.values(result.forces).reduce((s, v) => s + (v ?? 0), 0)
      expect(total).toBeGreaterThan(0)
    })
  })

  describe("template matching", () => {
    it("matches a known scenario template with high confidence", () => {
      // The scenario templates include questions about losing clients, raising funds, etc.
      const result = parseNaturalLanguage("What if we lose our biggest customer and churn spikes?")
      expect(result.confidence).toBeGreaterThanOrEqual(0.7)
    })
  })
})
