// src/logic/mountainForces.ts
import type { EngineResult } from "@/lib/truth/truthSelectors";
import { getRiskScore } from "@/logic/riskScore";
import { getQualityScore } from "@/logic/qualityScore";

export type MountainForces = {
  momentum: number;   // 0..1
  resilience: number; // 0..1
  quality: number;    // 0..1
};

/**
 * Canonical Phase-IG Mountain inputs.
 * The Mountain must ultimately be driven ONLY by these 3 forces.
 */
export function engineResultToMountainForces3(er: EngineResult | null): MountainForces {
  if (!er?.kpis) return { momentum: 0.5, resilience: 0.5, quality: 0.5 };

  const k = er.kpis;

  // ----------------------------
  // Momentum (0..1)
  // Prefer ARR growth pct if present (ratio form, e.g. 0.12 = +12%)
  // Map -50%..+50% into 0..1 (clamped). 0% -> 0.5
  // ----------------------------
  let momentum = 0.5;

  const g = k.arrGrowthPct?.value;
  if (typeof g === "number" && Number.isFinite(g)) {
    momentum = clamp01((g + 0.5) / 1.0);
  } else {
    // Fallback: if you have a 0..100 momentum KPI already
    const m = k.momentum?.value;
    if (typeof m === "number" && Number.isFinite(m)) {
      momentum = clamp01(m / 100);
    }
  }

  // ----------------------------
  // Quality (0..1)
  // Use canonical qualityScore (assumed 0..100) -> normalize to 0..1
  // ----------------------------
  const quality = clamp01(getQualityScore(er) / 100);

  // ----------------------------
  // Resilience (0..1)
  // Runway dominates + risk safety modulates.
  // runway: 0..24 months -> 0..1
  // riskScore: "danger" 0..100 (higher = worse) -> safety = (100-risk)/100
  // ----------------------------
  const runwayMonthsRaw = k.runway?.value;
  const runwayMonths = typeof runwayMonthsRaw === "number" && Number.isFinite(runwayMonthsRaw) ? runwayMonthsRaw : 0;
  const runwayScore = clamp01(runwayMonths / 24);

  const riskDanger = clamp01(getRiskScore(er) / 100);
  const riskSafety = clamp01(1 - riskDanger);

  const resilience = clamp01(runwayScore * 0.7 + riskSafety * 0.3);

  return { momentum, resilience, quality };
}

/**
 * Legacy terrain vector (0..1) used by older mountain code.
 * Kept so we DON'T break existing renderer paths while we rewire.
 *
 * Index mapping:
 * 0: REVENUE (ARR)
 * 1: PROFIT (Earnings Power / Gross Margin)
 * 2: RUNWAY
 * 3: CASH
 * 4: BURN
 * 5: EFFICIENCY (CAC / Unit Economics)
 * 6: RISK (safety)
 */
export function engineResultToMountainForces(er: EngineResult | null): number[] {
  if (!er?.kpis) return [0.5, 0.5, 0.6, 0.4, 0.5, 0.45, 0.35];

  const get = (key: string) => er.kpis[key]?.value ?? 0;
  
  const riskScore = getRiskScore(er);
  const riskSafety = invNorm(riskScore, 0, 100);
  
  // DEBUG: Log risk values

  return [
    norm(get("arrNext12"), 0, 10_000_000),            // 0: Revenue (0-10M)
    norm(get("earningsPower"), 0, 100),               // 1: Profit/Margin (0-100%)
    norm(get("runway"), 0, 36),                       // 2: Runway (0-36 mo)
    norm(get("cashPosition"), 0, 5_000_000),          // 3: Cash (0-5M)
    invNorm(get("burnQuality") * 1000, 0, 200_000),   // 4: Burn (inverted)
    norm(get("ltvCac"), 0, 6),                        // 5: Efficiency (LTV/CAC)
    riskSafety,                                        // 6: Risk (safety)
  ].map(clamp01);
}

function norm(x: number, min: number, max: number): number {
  if (!Number.isFinite(x)) return 0;
  if (max === min) return 0;
  return (x - min) / (max - min);
}
function invNorm(x: number, min: number, max: number): number {
  return 1 - norm(x, min, max);
}
function clamp01(n: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
}

