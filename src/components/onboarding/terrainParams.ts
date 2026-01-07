import type { OnboardingPreset } from "./onboarding.types";

export type TerrainParams = {
  /** 0..1 */
  growth?: number; // peak height
  /** 0..1 */
  cost?: number; // tree line height
  /** 0..1 */
  runway?: number; // water level
  /** 0..1 */
  risk?: number; // mist density
  /** 0..1 */
  scenario?: number; // ridge shift / secondary peak emphasis
};

export type TerrainInputs = {
  // raw values from onboarding (whatever your UI uses)
  growthValue: number; // e.g. 0..100
  costValue: number; // e.g. 0..100
  runwayValue: number; // e.g. 0..100
  riskValue: number; // e.g. 0..100
  scenarioValue: number; // e.g. 0..100
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function toTerrainParams(i: TerrainInputs): Required<TerrainParams> {
  // Normalize to 0..1 in one place (no hidden magic elsewhere)
  return {
    growth: clamp01(i.growthValue / 100),
    cost: clamp01(i.costValue / 100),
    runway: clamp01(i.runwayValue / 100),
    risk: clamp01(i.riskValue / 100),
    scenario: clamp01(i.scenarioValue / 100),
  };
}

/**
 * Current onboarding uses categorical "preset" chips rather than numeric sliders.
 * This adapter maps those choices into calm 0..1 values for the terrain visual.
 */
export function presetToTerrainParams(preset: OnboardingPreset): Required<TerrainParams> {
  const growth = (
    {
      conservative: 0.38,
      balanced: 0.52,
      aggressive: 0.7,
    } as const
  )[preset.growthPosture];

  const risk = (
    {
      low: 0.22,
      medium: 0.45,
      high: 0.75,
    } as const
  )[preset.riskAppetite];

  const scenario = (
    {
      certainty: 0.42,
      balanced: 0.5,
      speed: 0.62,
    } as const
  )[preset.executionBias];

  const costBase = (
    {
      tight: 0.4,
      normal: 0.52,
      loose: 0.66,
    } as const
  )[preset.burnDiscipline];

  // Subtle interactions: higher growth posture tends to raise costs and compress runway a bit.
  const cost = clamp01(costBase + (growth - 0.5) * 0.12);

  const runwayBase = (
    {
      tight: 0.72,
      normal: 0.56,
      loose: 0.42,
    } as const
  )[preset.burnDiscipline];

  const runway = clamp01(runwayBase - (growth - 0.5) * 0.18 - (risk - 0.45) * 0.1);

  return { growth, cost, runway, risk, scenario };
}


