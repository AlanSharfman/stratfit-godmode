import type { StrategicSignal } from "./strategicSignalTypes";

export type BeaconKind =
  | "LiquidityPressureBeacon"
  | "RiskWeatherBeacon"
  | "CapitalWindowBeacon"
  | "GrowthMomentumBeacon";

export interface SignalBeacon {
  kind: BeaconKind;
  label: string;
  intensity01: number;     // 0..1
  direction: StrategicSignal["direction"];
  severity: StrategicSignal["severity"];
  // terrain/time anchoring (future):
  // these are placeholders ONLY, kept primitive and optional.
  // They can be wired later by whichever orchestrator computes anchors.
  timeHorizonMonths?: number; // e.g., 3, 6, 12
  anchorKey?: string;         // e.g., "Q+2", "M+6", "FundingWindow"
  evidence: string[];
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function kindFromSignalId(id: StrategicSignal["id"]): BeaconKind {
  switch (id) {
    case "liquidity_pressure": return "LiquidityPressureBeacon";
    case "risk_weather": return "RiskWeatherBeacon";
    case "capital_window": return "CapitalWindowBeacon";
    default: return "GrowthMomentumBeacon";
  }
}

function defaultHorizonFor(kind: BeaconKind): number {
  switch (kind) {
    case "LiquidityPressureBeacon": return 3;
    case "RiskWeatherBeacon": return 3;
    case "CapitalWindowBeacon": return 6;
    case "GrowthMomentumBeacon": return 6;
  }
}

/**
 * Deterministic conversion:
 * - Creates at most one beacon per signal id.
 * - Filters out very low intensity noise (<0.15).
 */
export function generateBeaconsFromSignals(signals: StrategicSignal[]): SignalBeacon[] {
  if (!signals || signals.length === 0) return [];

  const out: SignalBeacon[] = [];

  for (const s of signals) {
    const intensity01 = clamp01(s.intensity01);
    if (intensity01 < 0.15) continue;

    const kind = kindFromSignalId(s.id);

    out.push({
      kind,
      label: s.title,
      intensity01,
      direction: s.direction,
      severity: s.severity,
      timeHorizonMonths: defaultHorizonFor(kind),
      anchorKey: undefined, // wired later by orchestrator/anchor system
      evidence: s.evidence,
    });
  }

  // deterministic stable ordering
  out.sort((a, b) => {
    if (b.intensity01 !== a.intensity01) return b.intensity01 - a.intensity01;
    return a.kind.localeCompare(b.kind);
  });

  return out;
}
