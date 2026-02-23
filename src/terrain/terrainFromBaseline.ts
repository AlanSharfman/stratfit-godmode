import { BaselineInputs } from "@/pages/initialize/initialize.types";

export interface TerrainMetrics {
  elevationScale: number;
  roughness: number;
  liquidityDepth: number;
  growthSlope: number;
  volatility: number;
}

export function deriveTerrainMetrics(inputs: BaselineInputs): TerrainMetrics {
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
