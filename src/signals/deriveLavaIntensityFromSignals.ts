import type { StrategicSignal } from "./strategicSignalTypes";

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function sevWeight(sev: StrategicSignal["severity"]) {
  switch (sev) {
    case "critical": return 1.0;
    case "high": return 0.8;
    case "medium": return 0.5;
    default: return 0.25;
  }
}

/**
 * Deterministic adapter:
 * - Intensifies lava when critical/high signals are present,
 * - Bias toward liquidity_pressure + risk_weather (system stress).
 *
 * Returns 0..1.
 */
export function deriveLavaIntensityFromSignals(signals: StrategicSignal[]): number {
  if (!signals || signals.length === 0) return 0;

  let weightedSum = 0;
  let weightTotal = 0;

  for (const s of signals) {
    // domain bias (stress signals matter more)
    const domainBias =
      s.id === "liquidity_pressure" ? 1.15 :
      s.id === "risk_weather" ? 1.10 :
      s.id === "capital_window" ? 0.95 :
      0.90; // growth_momentum

    const w = sevWeight(s.severity) * domainBias;
    weightedSum += clamp01(s.intensity01) * w;
    weightTotal += w;
  }

  if (weightTotal === 0) return 0;
  return clamp01(weightedSum / weightTotal);
}
