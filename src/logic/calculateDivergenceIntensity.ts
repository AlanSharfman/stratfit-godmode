export interface DivergenceInputs {
  survivalDelta: number;
  volatilityDelta: number;
  confidenceDelta: number;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function calculateDivergenceIntensity(
  inputs: DivergenceInputs
): number {
  const survivalWeight = Math.abs(inputs.survivalDelta);
  const volatilityWeight = Math.abs(inputs.volatilityDelta);
  const confidenceWeight = Math.abs(inputs.confidenceDelta);

  const raw =
    survivalWeight * 0.4 +
    volatilityWeight * 0.35 +
    confidenceWeight * 0.25;

  return clamp01(raw);
}
