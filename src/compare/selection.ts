// src/compare/selection.ts
// Compare selection persistence (PASS 4B) — minimal, safe localStorage helper.

export const COMPARE_SELECTION_KEY = "stratfit.compare.selection.v1";

export interface CompareSelectionV1 {
  baseline: true;
  scenarioIds: string[];
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function isSelectionV1(x: unknown): x is CompareSelectionV1 {
  if (!x || typeof x !== "object") return false;
  const o = x as Partial<CompareSelectionV1>;
  return o.baseline === true && Array.isArray(o.scenarioIds) && o.scenarioIds.every((s) => typeof s === "string");
}

export function setCompareSelection(selection: CompareSelectionV1): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COMPARE_SELECTION_KEY, JSON.stringify(selection));
}

export function getCompareSelection(): CompareSelectionV1 | null {
  if (typeof window === "undefined") return null;
  const parsed = safeParse<unknown>(window.localStorage.getItem(COMPARE_SELECTION_KEY));
  return parsed && isSelectionV1(parsed) ? parsed : null;
}


