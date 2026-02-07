// src/onboard/baseline/storage.ts
// Baseline persistence (truth layer) — localStorage only.

import type { BaselineV1 } from "./types";
import { safeJsonRead, safeJsonWrite } from "@/utils/safeLocalStorageJson";

export const BASELINE_STORAGE_KEY = "stratfit.baseline.v1";

function isBaselineV1(x: unknown): x is BaselineV1 {
  if (!x || typeof x !== "object") return false;
  return (x as { version?: unknown }).version === 1;
}

export function saveBaseline(baseline: BaselineV1): void {
  if (typeof window === "undefined") return;
  safeJsonWrite(BASELINE_STORAGE_KEY, baseline);
}

export function loadBaseline(): BaselineV1 | null {
  if (typeof window === "undefined") return null;
  const parsed = safeJsonRead<unknown>(BASELINE_STORAGE_KEY);
  if (!parsed) return null;
  return isBaselineV1(parsed) ? parsed : null;
}

export function hasBaseline(): boolean {
  return !!loadBaseline();
}


