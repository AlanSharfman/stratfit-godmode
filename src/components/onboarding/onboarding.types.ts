// src/components/onboarding/onboarding.types.ts
// STRATFIT Onboarding canonical contract (G-D MODE)
// Rules: no Date objects, no any.

export type HorizonMonths = 12 | 24 | 36 | 48 | 60;

export type ScenarioKey = "base" | "upside" | "downside" | "extreme";
export type ScenarioToggles = Readonly<Record<ScenarioKey, boolean>>;

export type ViewMode = "operator" | "investor";

export interface ScenarioSettings {
  horizon: HorizonMonths;
  scenarios: ScenarioToggles;
  viewMode: ViewMode;
}

export interface OnboardingData {
  scenarioSettings?: ScenarioSettings;
  // Page 1/3/4 can extend later without breaking Page2.
}

export const DEFAULT_SCENARIO_SETTINGS: ScenarioSettings = {
  horizon: 24,
  scenarios: {
    base: true,
    upside: true,
    downside: true,
    extreme: false,
  },
  viewMode: "operator",
};

export function countEnabledScenarios(s: ScenarioToggles): number {
  return (Object.values(s) as boolean[]).reduce((acc, v) => acc + (v ? 1 : 0), 0);
}

export function ensureAtLeastOneScenario(next: ScenarioToggles): ScenarioToggles {
  return countEnabledScenarios(next) === 0 ? { ...next, base: true } : next;
}
