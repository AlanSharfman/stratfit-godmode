// src/onboard/baseline/map.ts
// Pure mapping: Onboarding draft -> BaselineV1 (no side effects)

import type { OnboardingData } from "../schema";
import type { BaselineV1 } from "./types";

function num(raw: string): number {
  const s = String(raw ?? "").replace(/,/g, "").trim();
  if (!s) return 0;
  const x = Number(s);
  return Number.isFinite(x) ? x : 0;
}

function pct01(rawPct0to100: string): number {
  // Store percentages as 0..100; clamp to keep baseline stable.
  const x = num(rawPct0to100);
  if (x < 0) return 0;
  if (x > 100) return 100;
  return x;
}

function normalizeDateISO(raw: string): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return null;
}

export function mapOnboardDraftToBaseline(draft: OnboardingData): BaselineV1 {
  return {
    version: 1,

    company: {
      legalName: draft.companyProfile.legalName.trim(),
      industry: draft.companyProfile.industry,
      businessModel: draft.companyProfile.businessModel,
      primaryMarket: draft.companyProfile.primaryMarket,
      // Initialize Baseline identity fields — not in onboard draft
      founderName: "",
      contactEmail: "",
      contactPhone: "",
      jurisdiction: "",
    },

    financial: {
      arr: num(draft.financialBaselineCore.arr),
      growthRatePct: pct01(draft.financialBaselineCore.growthRate),
      grossMarginPct: pct01(draft.financialBaselineCore.grossMargin),
      revenueConcentrationPct: pct01(draft.financialBaselineCore.revenueConcentration),
      monthlyBurn: num(draft.financialBaselineCore.monthlyBurn),
      payroll: num(draft.financialBaselineCore.payroll),
      headcount: num(draft.financialBaselineCore.headcount),
      cashOnHand: num(draft.financialBaselineCore.cashOnHand),
      // Initialize Baseline canonical fields — not sourced from onboard draft
      nrrPct: 0,
      avgFullyLoadedCost: 0,
      salesMarketingSpend: 0,
      rdSpend: 0,
      gaSpend: 0,
    },

    capital: {
      totalDebt: num(draft.capitalStructureCore.totalDebt),
      interestRatePct: pct01(draft.capitalStructureCore.interestRate),
      monthlyDebtService: num(draft.capitalStructureCore.monthlyDebtService),
      lastRaiseAmount: num(draft.capitalStructureCore.lastRaiseAmount),
      lastRaiseDateISO: normalizeDateISO(draft.capitalStructureCore.lastRaiseDate),
      equityRaisedToDate: 0,
    },

    operating: {
      churnPct: pct01(draft.operatingDynamicsCore.churnPercent),
      salesCycleMonths: num(draft.operatingDynamicsCore.salesCycleMonths),
      acv: num(draft.operatingDynamicsCore.acv),
      keyPersonDependency: draft.operatingDynamicsCore.keyPersonDependency,
      customerConcentrationRisk: draft.operatingDynamicsCore.customerConcentrationRisk,
      regulatoryExposure: draft.operatingDynamicsCore.regulatoryExposure,
      activeCustomers: 0,
    },

    customerEngine: {
      cac: 0,
      ltv: 0,
      paybackPeriodMonths: 0,
      expansionRatePct: 0,
    },

    posture: {
      focus: draft.strategicPosture.focus,
      raiseIntent: draft.strategicPosture.raiseIntent,
      horizonMonths: draft.strategicPosture.horizon,
      primaryConstraint: draft.strategicPosture.primaryConstraint,
      fastestDownside: draft.strategicPosture.fastestDownside,
    },
  };
}
