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

export function deriveTerrainMetrics(inputs: InitializeFormInputs): TerrainMetrics {
  const growthFactor = inputs.growthRate / 100;
  const marginFactor = inputs.grossMargin / 100;
  const burnPressure = inputs.burnRate / (inputs.revenue || 1);
  const liquidity = inputs.cash / (inputs.burnRate || 1);

  return {
    elevationScale: 1 + growthFactor * 2,
    roughness: burnPressure * 2,
    liquidityDepth: Math.min(liquidity / 12, 2),
    growthSlope: growthFactor,
    volatility: Math.abs(growthFactor - marginFactor),
  };
}
