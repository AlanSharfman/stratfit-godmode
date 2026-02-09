// tests/baselineCompleteness.test.ts
// Unit tests for baseline completeness calculator

import { describe, it, expect } from "vitest";
import { computeBaselineCompleteness } from "../src/logic/confidence/baselineCompleteness";
import type { BaselineV1 } from "../src/onboard/baseline";

// Helper to build a fully-populated baseline
function makeFullBaseline(): BaselineV1 {
  return {
    version: 1,
    company: {
      legalName: "Test Corp",
      industry: "SaaS",
      businessModel: "Subscription",
      primaryMarket: "US",
      founderName: "Jane Doe",
      contactEmail: "jane@test.com",
      contactPhone: "+1234567890",
      jurisdiction: "US-DE",
    },
    financial: {
      arr: 4_000_000,
      growthRatePct: 45,
      grossMarginPct: 75,
      revenueConcentrationPct: 20,
      monthlyBurn: 200_000,
      payroll: 150_000,
      headcount: 30,
      cashOnHand: 3_000_000,
      nrrPct: 115,
      avgFullyLoadedCost: 120_000,
      salesMarketingSpend: 50_000,
      rdSpend: 60_000,
      gaSpend: 30_000,
    },
    capital: {
      totalDebt: 500_000,
      interestRatePct: 8,
      monthlyDebtService: 10_000,
      lastRaiseAmount: 5_000_000,
      lastRaiseDateISO: "2025-06-01",
      equityRaisedToDate: 8_000_000,
    },
    operating: {
      churnPct: 5,
      salesCycleMonths: 3,
      acv: 24_000,
      keyPersonDependency: "medium",
      customerConcentrationRisk: "low",
      regulatoryExposure: "low",
      activeCustomers: 150,
    },
    customerEngine: {
      cac: 8_000,
      ltv: 96_000,
      paybackPeriodMonths: 12,
      expansionRatePct: 20,
    },
    posture: {
      focus: "growth",
      raiseIntent: "yes",
      horizonMonths: 36,
      primaryConstraint: "capital",
      fastestDownside: "churn_spike",
    },
  } as BaselineV1;
}

describe("computeBaselineCompleteness", () => {
  it("returns 0 for null baseline", () => {
    const result = computeBaselineCompleteness(null);
    expect(result.completeness01).toBe(0);
    expect(result.filledCount).toBe(0);
    expect(result.missing.length).toBeGreaterThan(0);
  });

  it("returns high completeness for fully-populated baseline", () => {
    const baseline = makeFullBaseline();
    const result = computeBaselineCompleteness(baseline);
    expect(result.completeness01).toBeGreaterThanOrEqual(0.9);
    expect(result.filledCount).toBeGreaterThanOrEqual(15);
  });

  it("returns lower completeness when financial fields missing", () => {
    const baseline = makeFullBaseline();
    baseline.financial.arr = 0;
    baseline.financial.monthlyBurn = 0;
    baseline.financial.cashOnHand = 0 as any;
    const result = computeBaselineCompleteness(baseline);
    expect(result.completeness01).toBeLessThan(0.9);
    expect(result.missing.length).toBeGreaterThan(0);
  });

  it("reports missing fields by name", () => {
    const baseline = makeFullBaseline();
    baseline.financial.nrrPct = 0 as any; // 0 fails isPctBound for nrrPct? No, isPctBound allows 0
    // Let's set to null-ish
    (baseline.financial as any).nrrPct = undefined;
    const result = computeBaselineCompleteness(baseline);
    expect(result.missing).toContain("NRR %");
  });
});



