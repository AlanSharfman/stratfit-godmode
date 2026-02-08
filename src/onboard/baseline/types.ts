// src/onboard/baseline/types.ts
// STRATFIT Baseline (v1) — compact "truth layer" for Terrain initialization.

import type {
  FastestDownside,
  HorizonMonths,
  PrimaryConstraint,
  StrategicFocus,
  TriLevel,
  YesNoUncertain,
} from "../schema";

export interface BaselineV1 {
  version: 1;

  company: {
    legalName: string;
    industry: string;
    businessModel: string;
    primaryMarket: string;
    // ── Initialize Baseline: identity fields ──
    founderName: string;
    contactEmail: string;
    contactPhone: string;
    jurisdiction: string;
  };

  financial: {
    arr: number;
    growthRatePct: number;
    grossMarginPct: number;
    revenueConcentrationPct: number;
    monthlyBurn: number;
    payroll: number;
    headcount: number;
    cashOnHand: number;
    // ── Initialize Baseline canonical additions ──
    nrrPct: number;
    avgFullyLoadedCost: number;
    salesMarketingSpend: number;
    rdSpend: number;
    gaSpend: number;
  };

  capital: {
    totalDebt: number;
    interestRatePct: number;
    monthlyDebtService: number;
    lastRaiseAmount: number;
    lastRaiseDateISO: string | null;
    // ── Initialize Baseline ──
    equityRaisedToDate: number;
  };

  operating: {
    churnPct: number;
    salesCycleMonths: number;
    acv: number;
    keyPersonDependency: TriLevel;
    customerConcentrationRisk: TriLevel;
    regulatoryExposure: TriLevel;
    // ── Initialize Baseline ──
    activeCustomers: number;
  };

  customerEngine: {
    cac: number;
    ltv: number;
    paybackPeriodMonths: number;
    expansionRatePct: number;
  };

  posture: {
    focus: StrategicFocus;
    raiseIntent: YesNoUncertain;
    horizonMonths: HorizonMonths;
    primaryConstraint: PrimaryConstraint;
    fastestDownside: FastestDownside;
  };
}
