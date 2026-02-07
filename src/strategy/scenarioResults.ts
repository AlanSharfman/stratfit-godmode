// src/strategy/scenarioResults.ts
// PASS 4C — Per-scenario result persistence (localStorage-backed)

export const SCENARIO_RESULTS_KEY = "stratfit.scenario.results.v1";

export type ScenarioResultsMap = Record<string, unknown>;

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadAllScenarioResults(): ScenarioResultsMap {
  if (typeof window === "undefined") return {};
  const parsed = safeParse<unknown>(window.localStorage.getItem(SCENARIO_RESULTS_KEY));
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
  try {
    window.localStorage.setItem(SCENARIO_RESULTS_KEY, JSON.stringify(next));
  } catch {
    // If storage is corrupted or quota is exceeded, reset to a minimal valid object.
    try {
      window.localStorage.setItem(SCENARIO_RESULTS_KEY, JSON.stringify({ [scenarioId]: result }));
    } catch {
      // give up silently
    }
  }
}


