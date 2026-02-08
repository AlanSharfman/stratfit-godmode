// src/onboard/baseline/storage.ts
// Baseline persistence (legacy localStorage layer).
//
// The canonical baseline truth now lives in useOnboardingStore (Zustand).
// This module retains localStorage read/write for backward-compatible modules
// that still consume BaselineV1 directly.

import type { BaselineV1 } from "./types";

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

  // Legacy key (for older modules that still read BaselineV1 directly)
  window.localStorage.setItem(BASELINE_STORAGE_KEY, JSON.stringify(baseline));
}

export function loadBaseline(): BaselineV1 | null {
  if (typeof window === "undefined") return null;
  const parsed = safeParse<unknown>(window.localStorage.getItem(BASELINE_STORAGE_KEY));
  if (!parsed) return null;
  return isBaselineV1(parsed) ? parsed : null;
}

export function hasBaseline(): boolean {
  return !!loadBaseline();
}
