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
  | "fundingInjection"
  | "cashSensitivity";

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
 * 0 REVENUE (MRR)
 * 1 PROFIT (Gross Profit)
 * 2 RUNWAY
 * 3 CASH (Cash Balance)
 * 4 BURN RATE
 * 5 EBITDA (CAC)
 * 6 RISK (Churn Rate)
 */
function leverToKpis(leverId: LeverId | null): number[] {
  switch (leverId) {
    case "revenueGrowth":
      return [0, 1, 2];
    case "pricingAdjustment":
      return [0, 1, 6];
    case "marketingSpend":
      return [0, 4, 5];
    case "headcount":
      return [4, 5, 1];
    case "operatingExpenses":
      return [4, 5, 2];
    case "churnSensitivity":
      return [6, 2, 0];
    case "fundingInjection":
      return [3, 2, 4];
    case "cashSensitivity":
      return [3, 2, 4]; // CASH, RUNWAY, BURN RATE
    default:
      return [];
  }
}

function influenceStrength(rank: number) {
  if (rank === 0) return 1.0;
  if (rank === 1) return 0.7;
  if (rank === 2) return 0.45;
  return 0.25;
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

  // ---- Signature "massif" backbone (always-on, makes it feel like a mountain even at flat dp)
  // VERY STRONG baseline to prevent any visible drop when levers are released
  peaks.push(
    { index: 3.1, amplitude: 0.55, sigma: 2.5, tag: "signature" },
    { index: 2.0, amplitude: 0.38, sigma: 2.0, tag: "signature" },
    { index: 4.3, amplitude: 0.38, sigma: 2.0, tag: "signature" },
    { index: 1.0, amplitude: 0.25, sigma: 1.6, tag: "signature" },
    { index: 5.2, amplitude: 0.25, sigma: 1.6, tag: "signature" }
  );

  // ---- Primary: hovered/clicked KPI emphasis
  if (args.activeKpiIndex != null) {
    const idx = safeIndex(Math.round(args.activeKpiIndex), kpiCount);
    peaks.push({
      index: idx,
      amplitude: 0.45 + intensity * 0.45, // stronger lift
      sigma: 0.55,
      tag: "primary",
    });

    // add a small ridge companion peak to create "mountain geometry" not a single spike
    peaks.push({
      index: idx + (idx < 3 ? 0.55 : -0.55),
      amplitude: 0.22 + intensity * 0.2,
      sigma: 0.9,
      tag: "ridge",
    });
  }

  // ---- Secondary: active lever ripples - MUCH STRONGER RESPONSE
  const targets = leverToKpis(args.activeLeverId ?? null).map((t) =>
    safeIndex(t, kpiCount)
  );

  if (targets.length > 0) {
    targets.forEach((kpiIdx, rank) => {
      const s = influenceStrength(rank);
      // Subtle emphasis only - base shape is data-driven
      peaks.push({
        index: kpiIdx,
        amplitude: (0.15 + intensity * 0.25) * s,
        sigma: rank === 0 ? 0.7 : 1.0,
        tag: "secondary",
      });

      // Minimal ridge accompaniment
      peaks.push({
        index: kpiIdx + (rank === 0 ? 0.35 : -0.35),
        amplitude: (0.08 + intensity * 0.15) * s,
        sigma: 1.3,
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
