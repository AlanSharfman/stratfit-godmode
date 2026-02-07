// src/strategy/scenarioResults.ts
// PASS 4C — Per-scenario result persistence (localStorage-backed)

import { safeJsonRead, safeJsonWrite } from "@/utils/safeLocalStorageJson";

export const SCENARIO_RESULTS_KEY = "stratfit.scenario.results.v1";

export type ScenarioResultsMap = Record<string, unknown>;

export function loadAllScenarioResults(): ScenarioResultsMap {
  if (typeof window === "undefined") return {};
  const parsed = safeJsonRead<unknown>(SCENARIO_RESULTS_KEY);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  return parsed as ScenarioResultsMap;
}

export function loadScenarioResult(scenarioId: string): unknown | null {
  const all = loadAllScenarioResults();
  return all[scenarioId] ?? null;
}

export function saveScenarioResult(scenarioId: string, result: unknown): void {
  if (typeof window === "undefined") return;
  const all = loadAllScenarioResults();
  const next: ScenarioResultsMap = { ...all, [scenarioId]: result };
  safeJsonWrite(SCENARIO_RESULTS_KEY, next);
}


