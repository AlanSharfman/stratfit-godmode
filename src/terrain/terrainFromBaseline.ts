import { InitializeFormInputs } from "@/pages/initialize/initialize.types";

export interface TerrainMetrics {
  elevationScale: number;
  roughness: number;
  liquidityDepth: number;
  growthSlope: number;
  volatility: number;
  /** Visual tuning overrides (optional — panel-driven) */
  ridgeIntensity?: number;       // 0–1
  valleyDepth?: number;          // 0–1
  peakSoftness?: number;         // 0–1
  noiseFrequency?: number;       // 0–3
  microDetailStrength?: number;  // 0–1
}

/**
 * Normalise a rate value that may be either a decimal (0.25) or a
 * percentage (25).  Returns a 0–1 factor.  Heuristic: if |v| <= 1
 * it’s already a decimal; otherwise divide by 100.
 */
function toFactor(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.abs(v) <= 1 ? v : v / 100;
}

export function deriveTerrainMetrics(inputs: InitializeFormInputs | Record<string, unknown>): TerrainMetrics {
  const growthRate = Number(inputs.growthRate) || 0;
  const grossMargin = Number(inputs.grossMargin) || 0;
  const cash = Number(inputs.cash) || 0;
  // Accept both burnRate (InitializeFormInputs) and monthlyBurn (BaselineInputs)
  const burnRate = Number(inputs.burnRate) || Number((inputs as any).monthlyBurn) || 0;
  const revenue = Number(inputs.revenue) || 0;

  const growthFactor = toFactor(growthRate);
  const marginFactor = toFactor(grossMargin);
  const burnPressure = revenue > 0 ? burnRate / revenue : 0;
  const liquidity = burnRate > 0 ? cash / burnRate : 24; // default 24mo if no burn

  return {
    elevationScale: 1 + growthFactor * 2,
    roughness: Math.min(burnPressure * 2, 4),
    liquidityDepth: Math.min(liquidity / 12, 2),
    growthSlope: growthFactor,
    volatility: Math.abs(growthFactor - marginFactor),
  };
}
