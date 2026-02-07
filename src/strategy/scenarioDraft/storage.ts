// src/strategy/scenarioDraft/storage.ts
// Local persistence for ScenarioDraftV1 (Strategy Studio) — non-destructive.

import type { ScenarioDraftV1 } from "./types";

export const SCENARIOS_KEY = "stratfit.scenarios.v1";
export const ACTIVE_SCENARIO_ID_KEY = "stratfit.scenario.active.v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function isDraftV1(x: unknown): x is ScenarioDraftV1 {
  if (!x || typeof x !== "object") return false;
  const o = x as Partial<ScenarioDraftV1>;
  return typeof o.id === "string" && typeof o.name === "string" && typeof o.createdAtISO === "string";
}

export function listScenarios(): ScenarioDraftV1[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParse<unknown>(window.localStorage.getItem(SCENARIOS_KEY));
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isDraftV1);
}

export function loadScenario(id: string): ScenarioDraftV1 | null {
  return listScenarios().find((s) => s.id === id) ?? null;
}

export function saveScenario(draft: ScenarioDraftV1): void {
  if (typeof window === "undefined") return;
  const list = listScenarios();
  const idx = list.findIndex((s) => s.id === draft.id);
  const next = idx >= 0 ? [...list.slice(0, idx), draft, ...list.slice(idx + 1)] : [draft, ...list];
  window.localStorage.setItem(SCENARIOS_KEY, JSON.stringify(next));
}

export function setActiveScenarioId(id: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_SCENARIO_ID_KEY, id);
}

export function getActiveScenarioId(): string | null {
  if (typeof window === "undefined") return null;
  const id = window.localStorage.getItem(ACTIVE_SCENARIO_ID_KEY);
  return id && id.trim() ? id : null;
}


