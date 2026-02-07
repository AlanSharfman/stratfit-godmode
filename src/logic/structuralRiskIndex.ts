import { EngineElasticityParams } from "./foundationElasticity";

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

/**
 * Founder-grade Structural Risk Index
 * 0 = extremely stable
 * 100 = highly fragile
 *
 * Derived purely from elasticity parameters.
 * No magic.
 */
export function calculateStructuralRiskIndex(
  elasticity: EngineElasticityParams | null
): number {
  if (!elasticity) return 50;

  const {
    revenueVolPct,
    burnVolPct,
    churnVolPct,
    shockProb,
    shockSeverityRevenuePct,
    shockSeverityBurnPct,
  } = elasticity;

  // Normalize components into 0–1 scale
  const volScore =
    (revenueVolPct / 0.14 +
      burnVolPct / 0.16 +
      churnVolPct / 0.40) /
    3;

  const shockScore =
    (shockProb / 0.12 +
      shockSeverityRevenuePct / 0.26 +
      shockSeverityBurnPct / 0.24) /
    3;

  const combined =
    0.6 * volScore +
    0.4 * shockScore;

  return Math.round(clamp(combined, 0, 1) * 100);
}

