// src/logic/spiderFitness.ts
// STRATFIT — Spider 2.0 (Strategic Fitness Profile) 0–100
// Safe defaults: missing inputs are tolerated.
// PHASE 1E: Risk + Quality use canonical truth selectors.

import { getRiskScore } from "@/lib/truth/truthSelectors";

export type SpiderAxisKey =
  | "growth_quality"
  | "unit_economics"
  | "capital_efficiency"
  | "scalability"
  | "risk_posture";

export type TrafficLight = "green" | "amber" | "red";

export type SpiderAxis = {
  key: SpiderAxisKey;
  label: string;
  value: number; // 0–100
  band: TrafficLight;
  explain: string;
};

export type ScenarioMetrics = Partial<{
  // core
  revenue: number;
  arr: number;
  arrGrowthPct: number; // 0–100+ (e.g. 16 means +16%)
  arrNext12: number;    // forward-looking ARR ($ value)
  grossMarginPct: number; // 0–100
  burnRateMonthly: number; // $/mo (positive number = burn)
  runwayMonths: number;
  riskScore: number; // 0–100 (higher = worse) — legacy, prefer riskIndex + selector
  riskIndex: number; // 0–100 health index (higher = healthier) — use with getRiskScore()

  // unit economics
  cac: number;
  ltv: number;
  ltvToCac: number; // ratio (e.g. 3.2)
  cacPaybackMonths: number;

  // efficiency
  burnMultiple: number; // net burn / net new ARR
  burnToArrPct: number; // (burn / ARR) * 100
  operatingLeveragePct: number; // optional

  // quality inputs (for truth selector)
  earningsPower: number;  // proxy for margin/efficiency
  burnQuality: number;    // proxy for burn discipline
}>;

const clamp100 = (x: number) => Math.max(0, Math.min(100, x));

/**
 * Piecewise linear scoring between threshold points.
 * points: [x, score] with x increasing.
 */
function scoreCurve(x: number, points: Array<[number, number]>): number {
  if (!Number.isFinite(x)) return 50;
  if (points.length < 2) return clamp100(x);

  if (x <= points[0][0]) return clamp100(points[0][1]);
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    if (x <= x1) {
      const t = (x - x0) / Math.max(1e-6, x1 - x0);
      return clamp100(y0 + t * (y1 - y0));
    }
  }
  return clamp100(points[points.length - 1][1]);
}

function bandForScore(s: number): TrafficLight {
  if (s >= 70) return "green";
  if (s >= 45) return "amber";
  return "red";
}

export function cacQualityBand(m: ScenarioMetrics): TrafficLight {
  const r = m.ltvToCac;
  const pb = m.cacPaybackMonths;
  if (Number.isFinite(r) && Number.isFinite(pb)) {
    if (r! >= 4 && pb! <= 12) return "green";
    if (r! >= 3 && pb! <= 18) return "amber";
    return "red";
  }
  // if missing, be conservative
  return "amber";
}

export function buildSpiderAxes(m: ScenarioMetrics): SpiderAxis[] {
  // ---------------------------------------------------------------------------
  // PHASE 1E — CFO Truth Curves (0–100 fitness)
  // Inputs:
  // - m.arrGrowthPct is PERCENT POINTS (e.g. -10.2, 16, 35)  ✅ ensured in ScenarioDeltaSnapshot.tsx
  // - m.arrNext12 is forward ARR ($)
  // - m.burnQuality, m.earningsPower are 0–100 proxies (as per your engine kpis)
  // - m.riskIndex is HEALTH (higher = better); canonical riskScore = 100 - riskIndex (higher = worse)
  // ---------------------------------------------------------------------------

  // 1) ARR Growth (fitness increases as growth increases)
  const arrGrowth = Number.isFinite(m.arrGrowthPct) ? m.arrGrowthPct : 0;
  const growthScore = scoreCurve(arrGrowth ?? 0, [
    [-20,  5],
    [  0, 25],
    [ 10, 55],
    [ 25, 80],
    [ 40, 95],
    [ 60,100],
  ]);

  // 2) ARR Scale (forward ARR in $ via arrNext12)
  const arrScale = Number.isFinite(m.arrNext12) ? m.arrNext12 : 0;
  const unitScore = scoreCurve(arrScale ?? 0, [
    [  500000, 15],
    [ 1000000, 35],
    [ 3000000, 60],
    [ 7000000, 80],
    [15000000, 95],
    [30000000,100],
  ]);

  // 3) Burn (proxy: burnQuality; higher = better discipline)
  const burnQ = Number.isFinite(m.burnQuality) ? m.burnQuality : 0;
  const capEffScore = scoreCurve(burnQ ?? 0, [
    [ 10, 10],
    [ 25, 35],
    [ 40, 60],
    [ 55, 80],
    [ 70, 95],
    [ 85,100],
  ]);

  // 4) Gross Margin proxy (earningsPower; higher = better)
  const earnP = Number.isFinite(m.earningsPower) ? m.earningsPower : 0;
  const scaleScore = scoreCurve(earnP ?? 0, [
    [ 10, 10],
    [ 25, 35],
    [ 40, 60],
    [ 55, 80],
    [ 70, 95],
    [ 85,100],
  ]);

  // 5) Risk (canonical): riskIndex is HEALTH; riskScore is DANGER
  // We convert to fitness: higher danger => lower fitness
  const riskScoreCanonical = getRiskScore({ kpis: { riskIndex: { value: m.riskIndex } } } as any);
  const risk = Number.isFinite(riskScoreCanonical) ? riskScoreCanonical : NaN;

  const riskPostureScore = scoreCurve(risk, [
    [ 20,100], // low danger
    [ 35, 85],
    [ 50, 65], // caution
    [ 65, 40], // danger
    [ 80, 20], // severe
    [ 90, 10], // near-failure
  ]);

  const axes: SpiderAxis[] = [
    {
      key: "growth_quality",
      label: "ARR Growth",
      value: growthScore,
      band: bandForScore(growthScore),
      explain: "YoY ARR growth rate. <0% contraction, 10-25% board-tolerable, 40%+ venture-grade.",
    },
    {
      key: "unit_economics",
      label: "ARR Scale",
      value: unitScore,
      band: bandForScore(unitScore),
      explain: "Forward ARR (12mo). $500K subscale → $15M+ institutional.",
    },
    {
      key: "capital_efficiency",
      label: "Burn",
      value: capEffScore,
      band: bandForScore(capEffScore),
      explain: "Burn discipline / capital efficiency. Higher = more disciplined.",
    },
    {
      key: "scalability",
      label: "Gross Margin",
      value: scaleScore,
      band: bandForScore(scaleScore),
      explain: "Margin quality (earningsPower proxy). Higher = better unit economics.",
    },
    {
      key: "risk_posture",
      label: "Risk",
      value: riskPostureScore,
      band: bandForScore(riskPostureScore),
      explain: "Survival risk (inverted). Higher riskScore → lower spider score.",
    },
  ];

  return axes;
}

