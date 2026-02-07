// src/onboard/storage.ts
// Local draft persistence (silent) + saved pulse events

import type { OnboardingData } from "./schema";
import { DEFAULT_ONBOARDING_DATA } from "./schema";

export const ONBOARD_DRAFT_KEY = "stratfit.onboard.v1";
export const ONBOARD_SAVED_EVENT = "stratfit:onboard:saved";

type Timer = ReturnType<typeof setTimeout>;

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadOnboardDraft(): OnboardingData {
  if (typeof window === "undefined") return DEFAULT_ONBOARDING_DATA;
  const parsed = safeJsonParse<Partial<OnboardingData>>(window.localStorage.getItem(ONBOARD_DRAFT_KEY));
  if (!parsed) return DEFAULT_ONBOARDING_DATA;
  return deepMerge(DEFAULT_ONBOARDING_DATA, parsed);
}

export function saveOnboardDraft(data: OnboardingData): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ONBOARD_DRAFT_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(ONBOARD_SAVED_EVENT));
}

export function createDebouncedDraftSaver(delayMs: number, onSaved?: () => void) {
  let t: Timer | null = null;
  return {
    schedule(data: OnboardingData) {
      if (typeof window === "undefined") return;
      if (t) window.clearTimeout(t);
      t = window.setTimeout(() => {
        saveOnboardDraft(data);
        onSaved?.();
      }, delayMs);
    },
    flush(data: OnboardingData) {
      if (typeof window === "undefined") return;
      if (t) window.clearTimeout(t);
      t = null;
      saveOnboardDraft(data);
      onSaved?.();
    },
    cancel() {
      if (typeof window === "undefined") return;
      if (t) window.clearTimeout(t);
      t = null;
    },
  };
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function deepMerge<T extends object>(base: T, patch: Partial<T>): T {
  if (!isPlainObject(base) || !isPlainObject(patch)) {
    // Fallback shallow merge for unexpected shapes
    return { ...(base as unknown as Record<string, unknown>), ...(patch as unknown as Record<string, unknown>) } as T;
  }
  return deepMergeRecord(base as Record<string, unknown>, patch as Record<string, unknown>) as T;
}

function deepMergeRecord(base: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    const b = base[k];
    if (isPlainObject(b) && isPlainObject(v)) out[k] = deepMergeRecord(b, v);
    else out[k] = v;
  }
  return out;
}


