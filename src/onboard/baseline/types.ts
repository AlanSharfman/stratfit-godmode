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
  };

  capital: {
    totalDebt: number;
    interestRatePct: number;
    monthlyDebtService: number;
    lastRaiseAmount: number;
    lastRaiseDateISO: string | null;
  };

  operating: {
    churnPct: number;
    salesCycleMonths: number;
    acv: number;
    keyPersonDependency: TriLevel;
    customerConcentrationRisk: TriLevel;
    regulatoryExposure: TriLevel;
  };

  posture: {
    focus: StrategicFocus;
    raiseIntent: YesNoUncertain;
    horizonMonths: HorizonMonths;
    primaryConstraint: PrimaryConstraint;
    fastestDownside: FastestDownside;
  };
}


