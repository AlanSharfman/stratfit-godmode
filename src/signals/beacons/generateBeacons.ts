export type BeaconType = "liquidity" | "risk" | "growth" | "capital";

export interface Beacon {
  id: string;
  type: BeaconType;
  severity01: number;    // 0..1
  positionT01: number;   // 0..1 (timeline-normalized anchor)
  title: string;
  message: string;
}

export interface BeaconInputs {
  survival: number;
  survivalDelta: number;
  runwayMonths: number;
  runwayDeltaMonths: number;
  volatility: number;   // 0..1
  confidence: number;   // 0..1
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function mkId(type: BeaconType) {
  return `beacon:${type}`;
}

/**
 * Beacon Generator v1
 * - Pure, deterministic
 * - Returns at most 1 beacon per type
 * - Uses conservative thresholds to avoid noise
 */
export function generateBeacons(inputs: BeaconInputs): Beacon[] {
  const out: Beacon[] = [];

  // Liquidity Pressure — runway compression ahead
  if (inputs.runwayDeltaMonths < -3) {
    const sev = clamp01(Math.abs(inputs.runwayDeltaMonths) / 12);
    out.push({
      id: mkId("liquidity"),
      type: "liquidity",
      severity01: sev,
      positionT01: 0.42,
      title: "Liquidity pressure",
      message: `Runway tightening: ${inputs.runwayDeltaMonths.toFixed(1)} months vs baseline.`,
    });
  }

  // Risk Weather — volatility elevated
  if (inputs.volatility > 0.60) {
    const sev = clamp01((inputs.volatility - 0.60) / 0.40);
    out.push({
      id: mkId("risk"),
      type: "risk",
      severity01: sev,
      positionT01: 0.56,
      title: "Risk weather",
      message: `Volatility elevated: ${(inputs.volatility * 100).toFixed(0)}%.`,
    });
  }

  // Growth Momentum — survival improving materially
  if (inputs.survivalDelta > 0.05) {
    const sev = clamp01((inputs.survivalDelta - 0.05) / 0.20);
    out.push({
      id: mkId("growth"),
      type: "growth",
      severity01: sev,
      positionT01: 0.34,
      title: "Growth momentum",
      message: `Survival improving: +${(inputs.survivalDelta * 100).toFixed(1)} pts vs baseline.`,
    });
  }

  // Capital Window — high confidence + strong survival
  if (inputs.confidence > 0.75 && inputs.survival > 0.70) {
    const sev = clamp01(((inputs.confidence - 0.75) / 0.25) * 0.7 + ((inputs.survival - 0.70) / 0.30) * 0.3);
    out.push({
      id: mkId("capital"),
      type: "capital",
      severity01: clamp01(sev),
      positionT01: 0.62,
      title: "Capital window",
      message: `Favorable conditions: confidence ${(inputs.confidence * 100).toFixed(0)}%, survival ${(inputs.survival * 100).toFixed(0)}%.`,
    });
  }

  // Deterministic ordering: highest severity, then stable type ordering.
  const typeOrder: Record<BeaconType, number> = { liquidity: 0, risk: 1, growth: 2, capital: 3 };
  out.sort((a, b) => {
    if (b.severity01 !== a.severity01) return b.severity01 - a.severity01;
    return typeOrder[a.type] - typeOrder[b.type];
  });

  return out;
}
