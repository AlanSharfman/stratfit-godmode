// src/memo/buildScenarioFactPack.ts
// Multi-Scenario Fact Pack builder for deterministic cross-scenario Q&A
// Uses existing engine, presentIntelligence, and band mapping only
// No new metrics, no raw numbers, no KPI duplication

import { ScenarioKey, ScenarioIntelligence } from "./buildScenarioMemo";
import { presentIntelligence } from "./presentIntelligence";

export type ScenarioFactPack = {
  scenario: ScenarioKey;
  labels: { title: string };
  intelligence: ScenarioIntelligence;
  facts: {
    runwayBand?: "short" | "medium" | "long";
    riskBand?: "low" | "moderate" | "high";
    growthBand?: "low" | "moderate" | "high";
    marginBand?: "weak" | "ok" | "strong";
    burnBand?: "light" | "moderate" | "heavy";
    valuationBand?: "lower" | "mid" | "upper";
  };
};

// Existing thresholds (example, replace with actual app logic)
const RUNWAY_THRESHOLDS = { short: 0.5, medium: 1, long: 3 };
const RISK_THRESHOLDS = { low: 2, moderate: 5, high: 15 };
const GROWTH_THRESHOLDS = { low: 2, moderate: 5, high: 15 };
const MARGIN_THRESHOLDS = { weak: 10, ok: 25, strong: 75 };
const BURN_THRESHOLDS = { light: 10, moderate: 25, heavy: 75 };
const VALUATION_THRESHOLDS = { lower: 5, mid: 10, upper: 30 };

function bandValue(val: number, bands: Record<string, number>): string {
  // Returns band name for value
  const entries = Object.entries(bands);
  for (let i = entries.length - 1; i >= 0; i--) {
    if (val >= entries[i][1]) return entries[i][0];
  }
  return entries[0][0];
}

export function buildScenarioFactPack(
  scenario: ScenarioKey,
  intelligence: ScenarioIntelligence,
  mode: "operator" | "investor"
): ScenarioFactPack {
  // Use presentIntelligence for investor/operator mode
  const presented = presentIntelligence(intelligence, mode);

  // Map bands from intelligence (replace with actual app logic)
  // Example: get values from intelligence.systemState or kpis
  // Here, use dummy values for illustration
  const facts: ScenarioFactPack["facts"] = {
    runwayBand: "medium", // TODO: map from intelligence
    riskBand: "moderate", // TODO: map from intelligence
    growthBand: "moderate", // TODO: map from intelligence
    marginBand: "ok", // TODO: map from intelligence
    burnBand: "moderate", // TODO: map from intelligence
    valuationBand: "mid", // TODO: map from intelligence
  };

  return {
    scenario,
    labels: { title: scenario.charAt(0).toUpperCase() + scenario.slice(1) },
    intelligence: presented,
    facts,
  };
}
