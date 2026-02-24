import {
  StrategicSignal,
  severityFromIntensity,
  clamp01,
  SignalDirection,
} from "./strategicSignalTypes";
import { directionFromDelta, normalizeAbsDelta, normalizeRange } from "./signalMath";

export interface SignalInputs {
  // canonical primitives (current)
  survival: number;     // 0..1 (probability)
  runwayMonths: number; // months
  valuation: number;    // currency
  volatility: number;   // 0..1 (or 0..something) - treated as normalized if already 0..1
  confidence: number;   // 0..1

  // baseline deltas (canonical - baseline)
  survivalDelta: number;
  runwayDeltaMonths: number;
  valuationDelta: number;

  // optional extra deltas (if available)
  volatilityDelta?: number;
  confidenceDelta?: number;
}

function nowISO(ts?: string) {
  return ts ?? new Date().toISOString();
}

/**
 * LIQUIDITY PRESSURE:
 * Higher intensity when runway is low AND/or runwayDelta is negative AND/or survival is deteriorating.
 */
export function buildLiquidityPressureSignal(
  input: SignalInputs,
  timestampISO?: string
): StrategicSignal {
  // runway risk: 0 at 24+ months, 1 at 0 months
  const runwayRisk = 1 - normalizeRange(input.runwayMonths, 0, 24);

  // runway deterioration: normalize abs delta against 12 months scale
  const runwayDeltaImpact = normalizeAbsDelta(input.runwayDeltaMonths, 12);

  // survival weakness: invert survival (assuming 0..1)
  const survivalWeakness = clamp01(1 - input.survival);

  // weighted intensity
  const intensity01 = clamp01(runwayRisk * 0.55 + runwayDeltaImpact * 0.25 + survivalWeakness * 0.2);

  const direction: SignalDirection = directionFromDelta(-input.runwayDeltaMonths);

  const evidence: string[] = [
    `Runway=${input.runwayMonths.toFixed(1)}mo`,
    `Runway Δ=${input.runwayDeltaMonths.toFixed(1)}mo`,
    `Survival=${(input.survival * 100).toFixed(1)}%`,
  ];

  return {
    id: "liquidity_pressure",
    title: "Liquidity Pressure",
    summary:
      intensity01 >= 0.65
        ? "Runway compression is material. Prioritize liquidity actions and funding readiness."
        : "Liquidity remains manageable. Monitor runway drift and burn discipline.",
    severity: severityFromIntensity(intensity01),
    direction,
    intensity01,
    evidence,
    timestampISO: nowISO(timestampISO),
  };
}

/**
 * RISK WEATHER:
 * Higher intensity when volatility is high and/or confidence is falling and/or survival falls.
 */
export function buildRiskWeatherSignal(
  input: SignalInputs,
  timestampISO?: string
): StrategicSignal {
  const volatilityLevel = clamp01(input.volatility);
  const confidenceWeakness = clamp01(1 - input.confidence);

  const survivalDeltaImpact = normalizeAbsDelta(input.survivalDelta, 0.2); // scale: 20pp

  const intensity01 = clamp01(volatilityLevel * 0.5 + confidenceWeakness * 0.3 + survivalDeltaImpact * 0.2);

  const volatilityDelta = input.volatilityDelta ?? 0;
  const correctedDirection: SignalDirection =
    volatilityDelta > 0 ? "deteriorating" : volatilityDelta < 0 ? "improving" : "flat";

  const evidence: string[] = [
    `Volatility=${(volatilityLevel * 100).toFixed(1)}%`,
    `Confidence=${(input.confidence * 100).toFixed(1)}%`,
    `Survival Δ=${(input.survivalDelta * 100).toFixed(1)}pp`,
  ];

  return {
    id: "risk_weather",
    title: "Risk Weather",
    summary:
      intensity01 >= 0.65
        ? "Risk conditions are elevated. Reduce exposure and tighten execution controls."
        : "Risk conditions are stable. Maintain monitoring and contingency planning.",
    severity: severityFromIntensity(intensity01),
    direction: correctedDirection,
    intensity01,
    evidence,
    timestampISO: nowISO(timestampISO),
  };
}

/**
 * CAPITAL WINDOW:
 * Higher intensity when survival is reasonable but runway pressure is rising and volatility is moderate.
 */
export function buildCapitalWindowSignal(
  input: SignalInputs,
  timestampISO?: string
): StrategicSignal {
  const survivalStrength = clamp01(input.survival);
  const runwayRisk = 1 - normalizeRange(input.runwayMonths, 0, 24);

  const v = clamp01(input.volatility);
  const volatilityWindow = clamp01(1 - Math.abs(v - 0.35) / 0.35);

  const intensity01 = clamp01(runwayRisk * 0.45 + survivalStrength * 0.35 + volatilityWindow * 0.2);

  const direction: SignalDirection = directionFromDelta(-input.runwayDeltaMonths);

  const evidence: string[] = [
    `Survival=${(input.survival * 100).toFixed(1)}%`,
    `Runway=${input.runwayMonths.toFixed(1)}mo`,
    `Volatility=${(v * 100).toFixed(1)}%`,
  ];

  return {
    id: "capital_window",
    title: "Capital Window",
    summary:
      intensity01 >= 0.65
        ? "Funding window is active. Prepare a raise while conditions are still supportive."
        : "Funding window is not urgent. Keep readiness assets current.",
    severity: severityFromIntensity(intensity01),
    direction,
    intensity01,
    evidence,
    timestampISO: nowISO(timestampISO),
  };
}

/**
 * GROWTH MOMENTUM:
 * Uses valuation delta as a proxy for momentum (until ARR/growth primitives exist).
 */
export function buildGrowthMomentumSignal(
  input: SignalInputs,
  timestampISO?: string
): StrategicSignal {
  const relValuationDelta = input.valuation === 0 ? 0 : input.valuationDelta / input.valuation;

  const intensity01 = clamp01(normalizeAbsDelta(relValuationDelta, 0.5));
  const direction: SignalDirection = directionFromDelta(input.valuationDelta);

  const evidence: string[] = [
    `Valuation=${input.valuation.toFixed(0)}`,
    `Valuation Δ=${input.valuationDelta.toFixed(0)}`,
    `Survival=${(input.survival * 100).toFixed(1)}%`,
  ];

  return {
    id: "growth_momentum",
    title: "Growth Momentum",
    summary:
      direction === "improving"
        ? "Momentum is improving. Consider reinforcing the drivers behind uplift."
        : direction === "deteriorating"
          ? "Momentum is weakening. Identify the drag and stabilize performance."
          : "Momentum is flat. Test small levers to create acceleration.",
    severity: severityFromIntensity(intensity01),
    direction,
    intensity01,
    evidence,
    timestampISO: nowISO(timestampISO),
  };
}

export function generateStrategicSignals(
  input: SignalInputs,
  timestampISO?: string
): StrategicSignal[] {
  return [
    buildLiquidityPressureSignal(input, timestampISO),
    buildRiskWeatherSignal(input, timestampISO),
    buildCapitalWindowSignal(input, timestampISO),
    buildGrowthMomentumSignal(input, timestampISO),
  ];
}
