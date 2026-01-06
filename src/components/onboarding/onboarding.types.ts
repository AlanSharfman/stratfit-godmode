// src/components/onboarding/onboarding.types.ts
// STRATFIT Onboarding canonical contract (G-D MODE)
// Rules: no Date objects, no any.

export type HorizonMonths = 12 | 24 | 36 | 48 | 60;

export type ScenarioKey = "base" | "upside" | "downside" | "extreme";

export type ViewMode = "operator" | "investor";

export type ScenarioToggles = Readonly<Record<ScenarioKey, boolean>>;

export type ScenarioSettings = {
  horizon: HorizonMonths;
  scenarios: ScenarioToggles;
  viewMode: ViewMode;
};

export type GrowthPosture = "conservative" | "balanced" | "aggressive";
export type BurnDiscipline = "tight" | "normal" | "loose";
export type RiskAppetite = "low" | "medium" | "high";
export type ExecutionBias = "certainty" | "balanced" | "speed";

export type OnboardingPreset = {
  growthPosture: GrowthPosture;
  burnDiscipline: BurnDiscipline;
  riskAppetite: RiskAppetite;
  executionBias: ExecutionBias;
};

export type OnboardingData = {
  scenarioSettings: ScenarioSettings;
  preset: OnboardingPreset;
};

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

export const DEFAULT_ONBOARDING_PRESET: OnboardingPreset = {
  growthPosture: "balanced",
  burnDiscipline: "normal",
  riskAppetite: "medium",
  executionBias: "balanced",
};

export const DEFAULT_ONBOARDING_DATA: OnboardingData = {
  scenarioSettings: DEFAULT_SCENARIO_SETTINGS,
  preset: DEFAULT_ONBOARDING_PRESET,
};

export function countEnabledScenarios(s: ScenarioToggles): number {
  return (Object.values(s) as boolean[]).reduce((acc, v) => acc + (v ? 1 : 0), 0);
}

export function ensureAtLeastOneScenario(next: ScenarioToggles): ScenarioToggles {
  return countEnabledScenarios(next) === 0 ? { ...next, base: true } : next;
}
