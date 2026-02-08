// src/onboard/baseline/storage.ts
// Baseline persistence (truth layer).
//
// NOTE:
// - This onboarding module was originally built with its own baseline key (`stratfit.baseline.v1`).
// - The current app's canonical baseline truth is `sf.baseline.v1` via `useBaselineStore`.
// - We write BOTH for backward compatibility, but the app should treat `sf.baseline.v1` as source of truth.

import type { BaselineV1 } from "./types";
import { useBaselineStore } from "@/state/onboardingStore";

export const BASELINE_STORAGE_KEY = "stratfit.baseline.v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function isBaselineV1(x: unknown): x is BaselineV1 {
  if (!x || typeof x !== "object") return false;
  return (x as { version?: unknown }).version === 1;
}

export function saveBaseline(baseline: BaselineV1): void {
  if (typeof window === "undefined") return;

  // 1) Legacy key (for older modules that still read BaselineV1 directly)
  window.localStorage.setItem(BASELINE_STORAGE_KEY, JSON.stringify(baseline));

  // 2) Canonical baseline store (sf.baseline.v1) used by the current app
  const s = useBaselineStore.getState();
  if (s.baselineLocked) return;

  const headcount = Number(baseline.financial.headcount ?? 0) || 0;
  const payrollAnnual = Number(baseline.financial.payroll ?? 0) || 0;
  const avgFullyLoadedCostAnnual =
    headcount > 0 && payrollAnnual > 0 ? payrollAnnual / headcount : undefined;

  s.setDraft({
    identity: {
      companyName: String(baseline.company.legalName ?? "").trim(),
      industry: String(baseline.company.industry ?? "").trim(),
      country: String(baseline.company.primaryMarket ?? "").trim() || "United States",
      currency: "USD",
    },
    metrics: {
      cashOnHand: Number(baseline.financial.cashOnHand ?? 0) || 0,
      monthlyBurn: Number(baseline.financial.monthlyBurn ?? 0) || 0,
      currentARR: Number(baseline.financial.arr ?? 0) || 0,
      monthlyGrowthPct: Number(baseline.financial.growthRatePct ?? 0) || 0,
      monthlyChurnPct: Number(baseline.operating.churnPct ?? 0) || 0,
      nrrPct: 100,
    },
    operating: {
      headcount,
      avgFullyLoadedCostAnnual,
    },
  });

  s.lockBaselineFromDraft();
}

export function loadBaseline(): BaselineV1 | null {
  if (typeof window === "undefined") return null;
  const parsed = safeParse<unknown>(window.localStorage.getItem(BASELINE_STORAGE_KEY));
  if (!parsed) return null;
  return isBaselineV1(parsed) ? parsed : null;
}

export function hasBaseline(): boolean {
  // Prefer canonical baseline store.
  const s = useBaselineStore.getState();
  if (s.baselineLocked) return true;
  // Fallback to legacy key.
  return !!loadBaseline();
}


