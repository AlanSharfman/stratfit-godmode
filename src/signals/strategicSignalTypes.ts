export type SignalId =
  | "liquidity_pressure"
  | "risk_weather"
  | "capital_window"
  | "growth_momentum";

export type SignalSeverity = "low" | "medium" | "high" | "critical";

export type SignalDirection = "improving" | "deteriorating" | "flat";

export interface StrategicSignal {
  id: SignalId;
  title: string;
  summary: string;
  severity: SignalSeverity;
  direction: SignalDirection;
  intensity01: number; // 0..1 normalized
  evidence: string[];  // short bullet proofs, deterministic strings only
  timestampISO: string; // creation timestamp (call-site)
}

export function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export function severityFromIntensity(intensity01: number): SignalSeverity {
  const x = clamp01(intensity01);
  if (x >= 0.85) return "critical";
  if (x >= 0.65) return "high";
  if (x >= 0.35) return "medium";
  return "low";
}
