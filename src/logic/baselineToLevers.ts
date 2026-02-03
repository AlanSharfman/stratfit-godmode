// src/logic/baselineToLevers.ts
// STRATFIT — Baseline Truth → Lever Snapshot mapping
// Deterministic and minimal: baseline drives BASE scenario input levers once locked.

import type { LeverSnapshot } from "@/state/scenarioStore";
import type { BaselineTruthSnapshot } from "@/state/onboardingStore";

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function clamp100(n: number) {
  if (!Number.isFinite(n)) return 50;
  return Math.max(0, Math.min(100, n));
}

function mapRangeTo01(x: number, inMin: number, inMax: number) {
  if (!Number.isFinite(x) || inMax === inMin) return 0.5;
  return clamp01((x - inMin) / (inMax - inMin));
}

function scaleTo100(x01: number) {
  return clamp100(Math.round(clamp01(x01) * 100));
}

export function baselineToLevers(baseline: BaselineTruthSnapshot): LeverSnapshot {
  const cash = Number(baseline.metrics.cashOnHand ?? 0);
  const burn = Math.abs(Number(baseline.metrics.monthlyBurn ?? 0));
  const runwayMonths = burn > 0 ? cash / burn : 24;

  const growthPct = baseline.metrics.arrGrowthPct;
  const growth01 =
    typeof growthPct === "number"
      ? mapRangeTo01(growthPct, -20, 80) // -20% .. +80%
      : 0.5;

  const objective = baseline.answers.primaryObjective?.kind === "radio"
    ? baseline.answers.primaryObjective.value
    : "SURVIVAL";

  const riskAppetite = baseline.answers.riskAppetite?.kind === "radio"
    ? baseline.answers.riskAppetite.value
    : "MEDIUM";

  const growthUrgency = baseline.answers.growthUrgency?.kind === "scale" ? baseline.answers.growthUrgency.value : 5;
  const marginDiscipline = baseline.answers.marginDiscipline?.kind === "scale" ? baseline.answers.marginDiscipline.value : 5;
  const marketVolatility = baseline.answers.marketVolatility?.kind === "scale" ? baseline.answers.marketVolatility.value : 5;
  const executionConfidence = baseline.answers.executionConfidence?.kind === "scale" ? baseline.answers.executionConfidence.value : 6;
  const fundingConstraint = baseline.answers.fundingConstraint?.kind === "scale" ? baseline.answers.fundingConstraint.value : 5;
  const pricingPower = baseline.answers.pricingPower?.kind === "scale" ? baseline.answers.pricingPower.value : 5;
  const competitivePressure = baseline.answers.competitivePressure?.kind === "scale" ? baseline.answers.competitivePressure.value : 5;

  // Core posture signals
  const runway01 = clamp01(mapRangeTo01(runwayMonths, 3, 36)); // 3..36 months
  const burnPressure01 = 1 - runway01; // low runway => high pressure

  // DemandStrength: growth + objective + urgency
  const objectiveBoost =
    objective === "GROWTH" ? 0.15 :
    objective === "EXIT" ? 0.10 :
    objective === "PROFITABILITY" ? -0.05 :
    objective === "SURVIVAL" ? -0.10 :
    0;
  const demand01 = clamp01(growth01 * 0.55 + mapRangeTo01(growthUrgency, 0, 10) * 0.35 + 0.10 + objectiveBoost);

  // PricingPower lever: baseline answer + pricing model heuristics
  const pricingModel = baseline.operating.pricingModel;
  const pricingModelBoost =
    pricingModel === "USAGE" ? 0.10 :
    pricingModel === "TIERED" ? 0.06 :
    pricingModel === "SEAT_BASED" ? 0.04 :
    pricingModel === "SUBSCRIPTION" ? 0.02 :
    0;
  const pricing01 = clamp01(mapRangeTo01(pricingPower, 0, 10) * 0.75 + 0.15 + pricingModelBoost);

  // ExpansionVelocity: urgency + risk appetite (higher appetite tends to expand faster)
  const riskBoost =
    riskAppetite === "HIGH" ? 0.12 :
    riskAppetite === "LOW" ? -0.10 :
    0;
  const expansion01 = clamp01(mapRangeTo01(growthUrgency, 0, 10) * 0.55 + growth01 * 0.25 + 0.15 + riskBoost);

  // CostDiscipline: margin discipline + burn pressure
  const cost01 = clamp01(mapRangeTo01(marginDiscipline, 0, 10) * 0.55 + burnPressure01 * 0.35 + 0.10);

  // HiringIntensity: objective + urgency (bounded by burn pressure)
  const hiring01 = clamp01(mapRangeTo01(growthUrgency, 0, 10) * 0.55 + (objective === "GROWTH" ? 0.15 : 0.05) - burnPressure01 * 0.20);

  // OperatingDrag: competitive pressure + headcount (proxy for coordination load)
  const hc = Number(baseline.operating.headcount ?? 0);
  const hc01 = clamp01(mapRangeTo01(hc, 5, 500));
  const drag01 = clamp01(mapRangeTo01(competitivePressure, 0, 10) * 0.30 + hc01 * 0.55 + 0.10);

  // MarketVolatility lever: baseline volatility signal
  const marketVol01 = clamp01(mapRangeTo01(marketVolatility, 0, 10));

  // ExecutionRisk lever: inverse of confidence plus pressure
  const execRisk01 = clamp01((1 - mapRangeTo01(executionConfidence, 0, 10)) * 0.65 + burnPressure01 * 0.20 + 0.10);

  // FundingPressure lever: constraint + burn pressure
  const funding01 = clamp01(mapRangeTo01(fundingConstraint, 0, 10) * 0.55 + burnPressure01 * 0.35 + 0.10);

  return {
    demandStrength: scaleTo100(demand01),
    pricingPower: scaleTo100(pricing01),
    expansionVelocity: scaleTo100(expansion01),
    costDiscipline: scaleTo100(cost01),
    hiringIntensity: scaleTo100(hiring01),
    operatingDrag: scaleTo100(drag01),
    marketVolatility: scaleTo100(marketVol01),
    executionRisk: scaleTo100(execRisk01),
    fundingPressure: scaleTo100(funding01),
  };
}


