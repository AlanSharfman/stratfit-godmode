// src/logic/strategicCompiler.ts

import type { StrategicDeclarationPayload } from "@/types/strategicDeclaration";
import type { LeverState, SimulationConfig } from "@/logic/monteCarloEngine";

/**
 * These interfaces mirror what the Monte Carlo engine expects.
 * We keep this adapter PURE: declaration -> (levers, config)
 * No UI logic. No simulation logic.
 */

interface CompiledSimulationInput {
  levers: LeverState;
  config: SimulationConfig;
}

function clamp(n: number, min = 0.5, max = 1.5) {
  return Math.max(min, Math.min(max, n));
}

/**
 * The engine levers in this repo are on a 0..100 scale, where 50 is neutral.
 * The compiler logic below naturally produces multipliers (~0.7..1.6).
 * We map multipliers -> 0..100 to keep engine shape unchanged.
 */
function multiplierToLever(mult: number): number {
  const raw = 50 + (mult - 1) * 100;
  return Math.round(Math.max(0, Math.min(100, raw)));
}

/**
 * Hybrid compiler:
 * - Intent sets directional bias
 * - Financial deltas set growth + margin pressure
 * - Execution posture modifies volatility + risk
 * - Guardrails clamp multipliers to safe engine range
 *
 * NOTE:
 * - iterations stays 10,000 for MVP (matches your chunking + UI)
 * - timeHorizonMonths stays 36 to match your current Simulate overlay + charts
 */
export function compileStrategicDeclaration(payload: StrategicDeclarationPayload): CompiledSimulationInput {
  const { strategy_profile, financial_baseline, target_structure, execution_posture, derived_metrics } = payload;

  // Growth pressure (target revenue declared for 24m, but we keep 36m horizon for MVP charts)
  const growthRequired =
    target_structure.target_revenue / Math.max(1, financial_baseline.baseline_revenue);

  const marginDelta = target_structure.target_margin - financial_baseline.gross_margin;

  // Intent bias (directional, not magical)
  const intentMap: Record<string, number> = {
    "Controlled Growth": 1.05,
    "Aggressive Expansion": 1.25,
    "Margin Optimization": 0.95,
    "Survival & Stabilization": 0.85,
    "Market Domination": 1.35,
    "Exit Preparation": 1.1,
  };

  const intentBias = intentMap[strategy_profile.intent_type] ?? 1;

  // Execution posture → risk multipliers
  const leadershipModifier: Record<string, number> = {
    "Fully Focused": 0.9,
    Stretched: 1.0,
    Fragmented: 1.2,
  };

  const teamModifier: Record<string, number> = {
    "Strong Bench": 0.9,
    Adequate: 1.0,
    Thin: 1.2,
  };

  const capitalModifier: Record<string, number> = {
    Confirmed: 0.85,
    Likely: 0.95,
    Uncertain: 1.1,
    None: 1.3,
  };

  const executionRiskMultiplier =
    (leadershipModifier[execution_posture.leadership_bandwidth] ?? 1) *
    (teamModifier[execution_posture.team_depth] ?? 1);

  const fundingPressureMultiplier = capitalModifier[execution_posture.capital_access] ?? 1;

  // Volatility structure
  const concentrationRisk = clamp(execution_posture.client_concentration / 100, 0, 1.5);

  const volatility = clamp(
    derived_metrics.volatilityIndex + execution_posture.client_concentration / 200,
    0.8,
    1.6
  );

  // Levers in multiplier space (guardrailed)
  const mult = {
    demandStrength: clamp(growthRequired * intentBias, 0.8, 1.6),
    // Margin delta interpreted as pricing power pressure (bounded)
    pricingPower: clamp(1 + marginDelta / 100, 0.8, 1.4),
    expansionVelocity: clamp(growthRequired * 0.8 * intentBias, 0.7, 1.6),
    // If you need margin lift, discipline tends to rise (bounded inverse)
    costDiscipline: clamp(1 - marginDelta / 150, 0.7, 1.3),
    hiringIntensity: clamp(growthRequired * 0.7, 0.7, 1.5),
    // Variable ratio + concentration = operational drag / fragility
    operatingDrag: clamp(financial_baseline.variable_ratio / 100 + concentrationRisk, 0.7, 1.5),
    marketVolatility: clamp(volatility, 0.8, 1.6),
    executionRisk: clamp(executionRiskMultiplier, 0.8, 1.6),
    fundingPressure: clamp(fundingPressureMultiplier, 0.8, 1.6),
  };

  // Map multiplier levers -> engine's 0..100 lever scale
  const levers: LeverState = {
    demandStrength: multiplierToLever(mult.demandStrength),
    pricingPower: multiplierToLever(mult.pricingPower),
    expansionVelocity: multiplierToLever(mult.expansionVelocity),
    costDiscipline: multiplierToLever(mult.costDiscipline),
    hiringIntensity: multiplierToLever(mult.hiringIntensity),
    operatingDrag: multiplierToLever(mult.operatingDrag),
    marketVolatility: multiplierToLever(mult.marketVolatility),
    executionRisk: multiplierToLever(mult.executionRisk),
    fundingPressure: multiplierToLever(mult.fundingPressure),
  };

  // Config derived from baseline economics
  const grossProfit =
    financial_baseline.baseline_revenue * (financial_baseline.gross_margin / 100);

  const annualBurn = financial_baseline.fixed_costs - grossProfit;

  // Engine generally treats burn as a positive outflow; keep sign-safe.
  const monthlyBurn = Math.max(0, annualBurn / 12);

  const config: SimulationConfig = {
    iterations: 10000,
    timeHorizonMonths: 36,
    startingCash: financial_baseline.cash,
    startingARR: financial_baseline.baseline_revenue,
    monthlyBurn,
  };

  return { levers, config };
}


