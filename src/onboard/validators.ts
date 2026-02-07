// src/onboard/validators.ts
// Core validity rules per tab (v1) — strict enough for completion checks, not punitive

import type { OnboardingData } from "./schema";

function hasText(v: string | undefined | null) {
  return typeof v === "string" && v.trim().length > 0;
}

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function isNumberish(v: string) {
  const s = v.trim();
  if (!s) return false;
  const x = Number(s.replace(/,/g, ""));
  return Number.isFinite(x);
}

export type OnboardStepId = "company" | "financial" | "capital" | "operating" | "strategic";

export function validateCompany(d: OnboardingData): boolean {
  const c = d.companyProfile;
  return (
    hasText(c.legalName) &&
    hasText(c.industry) &&
    hasText(c.businessModel) &&
    hasText(c.primaryMarket) &&
    hasText(c.contactName) &&
    hasText(c.contactTitle) &&
    hasText(c.contactEmail) &&
    isEmail(c.contactEmail) &&
    hasText(c.contactPhone)
  );
}

export function validateFinancial(d: OnboardingData): boolean {
  const f = d.financialBaselineCore;
  return (
    isNumberish(f.arr) &&
    isNumberish(f.growthRate) &&
    isNumberish(f.grossMargin) &&
    isNumberish(f.revenueConcentration) &&
    isNumberish(f.monthlyBurn) &&
    isNumberish(f.payroll) &&
    isNumberish(f.headcount) &&
    isNumberish(f.cashOnHand)
  );
}

export function validateCapital(d: OnboardingData): boolean {
  const c = d.capitalStructureCore;
  return (
    isNumberish(c.totalDebt) &&
    isNumberish(c.interestRate) &&
    isNumberish(c.monthlyDebtService) &&
    isNumberish(c.lastRaiseAmount) &&
    hasText(c.lastRaiseDate)
  );
}

export function validateOperating(d: OnboardingData): boolean {
  const o = d.operatingDynamicsCore;
  return isNumberish(o.churnPercent) && isNumberish(o.salesCycleMonths) && isNumberish(o.acv);
}

export function validateStrategic(d: OnboardingData): boolean {
  const s = d.strategicPosture;
  return !!s.focus && !!s.raiseIntent && !!s.horizon && !!s.primaryConstraint && !!s.fastestDownside;
}

export function validateStep(step: OnboardStepId, d: OnboardingData): boolean {
  switch (step) {
    case "company":
      return validateCompany(d);
    case "financial":
      return validateFinancial(d);
    case "capital":
      return validateCapital(d);
    case "operating":
      return validateOperating(d);
    case "strategic":
      return validateStrategic(d);
  }
}


