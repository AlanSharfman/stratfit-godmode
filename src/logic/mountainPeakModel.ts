// src/logic/mountainPeakModel.ts

/**
 * Pure mapping: interaction state -> peak instructions
 * No store imports. No component imports. No side effects.
 */

export type LeverId =
  | "revenueGrowth"
  | "pricingAdjustment"
  | "marketingSpend"
  | "headcount"
  | "operatingExpenses"
  | "churnSensitivity"
  | "fundingInjection";

export interface PeakInstruction {
  index: number; // KPI domain index: 0..6 (fractional allowed for ridge shaping)
  amplitude: number; // 0..1+ (mountain renderer clamps naturally)
  sigma: number; // spread
  tag?: "primary" | "secondary" | "ridge" | "signature";
}

export interface PeakModelResult {
  peaks: PeakInstruction[];
  confidence01: number;
  affectedKpiIndices: number[];
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const safeIndex = (i: number, kpiCount: number) =>
  Math.max(0, Math.min(kpiCount - 1, i));

/**
 * Lever -> KPI influence mapping (must match your UI semantics).
 * KPI index reference (7):
 * 0 MRR
 * 1 Gross Profit
 * 2 Cash Balance
 * 3 Burn Rate
 * 4 Runway
 * 5 CAC
 * 6 Churn Rate
 */
function leverToKpis(leverId: LeverId | null): number[] {
  switch (leverId) {
    case "revenueGrowth":
      return [0, 1, 4];
    case "pricingAdjustment":
      return [0, 1, 6];
    case "marketingSpend":
      return [0, 5, 3];
    case "headcount":
      return [3, 4, 1];
    case "operatingExpenses":
      return [3, 4, 2];
    case "churnSensitivity":
      return [6, 0, 4];
    case "fundingInjection":
      return [2, 4, 3];
    default:
      return [];
  }
}

function influenceStrength(rank: number) {
  if (rank === 0) return 1.0;
  if (rank === 1) return 0.62;
  if (rank === 2) return 0.38;
  return 0.2;
}

export function buildPeakModel(args: {
  kpiCount: number;
  activeKpiIndex: number | null;
  activeLeverId: LeverId | null;
  leverIntensity01: number; // 0..1
}): PeakModelResult {
  const kpiCount = Math.max(2, Math.round(args.kpiCount || 7));
  const intensity = clamp01(args.leverIntensity01);

  const peaks: PeakInstruction[] = [];

  // ---- Signature "massif" backbone (always-on, subtle, makes it feel like a mountain even at flat dp)
  // This creates a central ridge and two side shoulders.
  peaks.push(
    { index: 3.1, amplitude: 0.22, sigma: 2.15, tag: "signature" },
    { index: 2.2, amplitude: 0.12, sigma: 1.75, tag: "signature" },
    { index: 4.2, amplitude: 0.12, sigma: 1.75, tag: "signature" }
  );

  // ---- Primary: hovered/clicked KPI emphasis
  if (args.activeKpiIndex != null) {
    const idx = safeIndex(Math.round(args.activeKpiIndex), kpiCount);
    peaks.push({
      index: idx,
      amplitude: 0.38 + intensity * 0.30, // big lift
      sigma: 0.58, // sharp enough to feel like a peak
      tag: "primary",
    });

    // add a small ridge companion peak to create "mountain geometry" not a single spike
    peaks.push({
      index: idx + (idx < 3 ? 0.55 : -0.55),
      amplitude: 0.18 + intensity * 0.14,
      sigma: 0.95,
      tag: "ridge",
    });
  }

  // ---- Secondary: active lever ripples
  const targets = leverToKpis(args.activeLeverId ?? null).map((t) =>
    safeIndex(t, kpiCount)
  );

  if (targets.length > 0) {
    targets.forEach((kpiIdx, rank) => {
      const s = influenceStrength(rank);
      peaks.push({
        index: kpiIdx,
        amplitude: (0.18 + intensity * 0.34) * s,
        sigma: rank === 0 ? 0.75 : 1.05,
        tag: "secondary",
      });

      // subtle ridge smear so it looks like terrain, not graph bumps
      peaks.push({
        index: kpiIdx + (rank === 0 ? 0.35 : -0.35),
        amplitude: (0.10 + intensity * 0.16) * s,
        sigma: 1.35,
        tag: "ridge",
      });
    });
  }

  // Confidence drives breathing/glow. It should be alive on hover OR lever drag.
  const confidence01 = clamp01(
    (args.activeKpiIndex != null ? 0.55 : 0) +
      (targets.length > 0 ? 0.35 : 0) +
      intensity * 0.35
  );

  // Flatten & dedupe affected KPI indices
  const affected = Array.from(new Set(targets)).sort((a, b) => a - b);

  return { peaks, confidence01, affectedKpiIndices: affected };
}
