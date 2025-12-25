import type { Inputs, Levers, Outputs, Delta } from "./types";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * Deterministic, explicit, defensible v1 mapping.
 * No magic multipliers hidden in UI.
 */
export function calculateOutputs(inputs: Inputs, levers: Levers): Outputs {
  // Normalise levers (safety)
  const L = {
    demandStrength: clamp01(levers.demandStrength),
    pricingPower: clamp01(levers.pricingPower),
    expansionVelocity: clamp01(levers.expansionVelocity),

    costDiscipline: clamp01(levers.costDiscipline),
    hiringIntensity: clamp01(levers.hiringIntensity),
    operatingDrag: clamp01(levers.operatingDrag),

    marketVolatility: clamp01(levers.marketVolatility),
    executionRisk: clamp01(levers.executionRisk),
  };

  /**
   * Revenue model (simple, explicit):
   * - demandStrength influences top-line volume
   * - pricingPower influences price realisation
   * - expansionVelocity influences growth execution (distribution/sales motion)
   *
   * Each lever contributes within a bounded band.
   */
  const demandFactor = 0.85 + 0.30 * L.demandStrength;        // 0.85..1.15
  const priceFactor = 0.90 + 0.20 * L.pricingPower;          // 0.90..1.10
  const expansionFactor = 0.90 + 0.25 * L.expansionVelocity; // 0.90..1.15

  const revenueAnnual = inputs.revenueAnnual * demandFactor * priceFactor * expansionFactor;

  /**
   * Margin model (bounded):
   * - pricingPower improves margin slightly
   * - operatingDrag worsens margin slightly
   * (still capped 0..0.95)
   */
  const marginAdj = (+0.06 * (L.pricingPower - 0.5)) + (-0.08 * (L.operatingDrag - 0.5));
  const grossMarginPct = Math.max(0, Math.min(0.95, inputs.grossMarginPct + marginAdj));

  /**
   * Opex model:
   * - costDiscipline reduces opex
   * - hiringIntensity increases opex
   * - operatingDrag increases opex (inefficiency)
   */
  const opexFactor =
    1
    + (-0.18 * (L.costDiscipline - 0.5))
    + (+0.22 * (L.hiringIntensity - 0.5))
    + (+0.20 * (L.operatingDrag - 0.5));

  const opexAnnual = Math.max(0, inputs.opexAnnual * opexFactor);

  /**
   * Burn:
   * burnAnnual = opex - grossProfit
   */
  const grossProfitAnnual = revenueAnnual * grossMarginPct;
  const burnAnnual = Math.max(0, opexAnnual - grossProfitAnnual);
  const burnMonthly = burnAnnual / 12;

  /**
   * Runway:
   * Guard against burnMonthly = 0
   */
  const runwayMonths = burnMonthly > 0 ? inputs.cashOnHand / burnMonthly : 999;

  /**
   * Risk score (0..100):
   * - marketVolatility + executionRisk increase risk
   * - operatingDrag increases risk
   * - stronger costDiscipline reduces risk slightly
   * - more runway reduces risk slightly (bounded effect)
   */
  const runwayBuffer = Math.max(0, Math.min(1, (runwayMonths - 6) / 18)); // 0 at 6mo, 1 at 24mo
  const riskRaw =
    0.40 * L.marketVolatility +
    0.35 * L.executionRisk +
    0.20 * L.operatingDrag +
    (-0.15 * L.costDiscipline) +
    (-0.20 * runwayBuffer);

  const riskScore = Math.max(0, Math.min(100, Math.round(riskRaw * 100)));

  /**
   * Valuation v1:
   * Revenue multiple only (explicit, CFO-defensible baseline)
   */
  const valuation = revenueAnnual * inputs.revenueMultiple;

  return {
    revenueAnnual,
    grossMarginPct,
    opexAnnual,
    burnAnnual,
    burnMonthly,
    runwayMonths,
    cashOnHand: inputs.cashOnHand,
    riskScore,
    valuation,
  };
}

export function calculateDeltas(base: Outputs, scenario: Outputs): Delta[] {
  const keys: (keyof Outputs)[] = [
    "revenueAnnual",
    "grossMarginPct",
    "opexAnnual",
    "burnAnnual",
    "burnMonthly",
    "runwayMonths",
    "riskScore",
    "valuation",
  ];

  return keys.map((key) => {
    const b = base[key] as number;
    const s = scenario[key] as number;
    const deltaAbs = s - b;
    const deltaPct = b !== 0 ? deltaAbs / b : null;
    return { key, base: b, scenario: s, deltaAbs, deltaPct };
  });
}
