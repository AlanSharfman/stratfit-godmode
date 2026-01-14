// src/logic/spiderFitness.ts
// STRATFIT — Spider 2.0 (Strategic Fitness Profile) 0–100
// Safe defaults: missing inputs are tolerated.
// PHASE 1E: Risk + Quality use canonical truth selectors.

import { getRiskScore, getQualityScore } from "@/lib/truth/truthSelectors";

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

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
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
  // A) Growth Quality
  const arrGrowth = Number.isFinite(m.arrGrowthPct) ? (m.arrGrowthPct as number) : NaN;
  const gm = Number.isFinite(m.grossMarginPct) ? (m.grossMarginPct as number) : NaN;

  const growthScore = clamp100(
    0.7 * scoreCurve(arrGrowth, [
      [0, 0],
      [15, 35],
      [30, 70],
      [50, 100],
    ]) +
      0.3 * scoreCurve(gm, [
        [40, 0],
        [55, 35],
        [70, 70],
        [80, 100],
      ])
  );

  // B) Unit Economics
  const ltvCac = Number.isFinite(m.ltvToCac) ? (m.ltvToCac as number) : NaN;
  const payback = Number.isFinite(m.cacPaybackMonths) ? (m.cacPaybackMonths as number) : NaN;

  const unitScore = clamp100(
    0.6 * scoreCurve(ltvCac, [
      [1, 0],
      [2, 25],
      [3, 55],
      [4, 80],
      [5, 100],
    ]) +
      0.4 * scoreCurve(payback, [
        [30, 0],
        [18, 40],
        [12, 75],
        [6, 100],
      ])
  );

  // C) Capital Efficiency
  const burnMultiple = Number.isFinite(m.burnMultiple) ? (m.burnMultiple as number) : NaN;
  const burnToArr = Number.isFinite(m.burnToArrPct) ? (m.burnToArrPct as number) : NaN;

  // prefer burnMultiple; fallback to burnToArr; else 50
  let capEffScore = 50;
  if (Number.isFinite(burnMultiple)) {
    // lower burn multiple is better
    capEffScore = scoreCurve(burnMultiple, [
      [4.0, 0],
      [3.0, 25],
      [2.0, 60],
      [1.5, 80],
      [1.0, 100],
    ]);
  } else if (Number.isFinite(burnToArr)) {
    capEffScore = scoreCurve(burnToArr, [
      [80, 0],
      [60, 25],
      [40, 60],
      [25, 80],
      [15, 100],
    ]);
  }

  // D) Scalability
  const opLev = Number.isFinite(m.operatingLeveragePct) ? (m.operatingLeveragePct as number) : NaN;
  const scaleScore = clamp100(
    0.7 * scoreCurve(gm, [
      [35, 0],
      [50, 35],
      [65, 70],
      [75, 90],
      [85, 100],
    ]) +
      0.3 * (Number.isFinite(opLev)
        ? scoreCurve(opLev, [
            [-10, 0],
            [0, 40],
            [10, 70],
            [20, 90],
            [30, 100],
          ])
        : 70) // if missing leverage, don't punish harshly
  );

  // E) Risk Posture — USES CANONICAL TRUTH SELECTOR
  const runway = Number.isFinite(m.runwayMonths) ? (m.runwayMonths as number) : NaN;
  
  // Get canonical risk score via truth selector (higher = worse)
  // If riskIndex provided, use selector; else fallback to legacy riskScore
  let canonicalRiskScore: number;
  if (Number.isFinite(m.riskIndex)) {
    // Use truth selector: getRiskScore expects EngineResult-like shape
    canonicalRiskScore = getRiskScore({ kpis: { riskIndex: { value: m.riskIndex! } } } as any);
  } else if (Number.isFinite(m.riskScore)) {
    canonicalRiskScore = m.riskScore as number;
  } else {
    canonicalRiskScore = 50; // neutral fallback
  }

  // Higher riskScore = worse → lower spider axis score
  // Curve: 35 safe, 55 caution, 75 danger, 90 severe
  const riskAxisFromDanger = scoreCurve(canonicalRiskScore, [
    [35, 100],  // low danger = high score
    [55, 70],   // moderate danger
    [75, 35],   // high danger
    [90, 10],   // severe danger = low score
  ]);

  const riskPostureScore = clamp100(
    0.55 * scoreCurve(runway, [
      [3, 0],
      [6, 25],
      [12, 65],
      [18, 85],
      [24, 100],
    ]) +
      0.45 * riskAxisFromDanger
  );

  const axes: SpiderAxis[] = [
    {
      key: "growth_quality",
      label: "ARR Growth",
      value: growthScore,
      band: bandForScore(growthScore),
      explain: "How healthy and sustainable the growth profile is (ARR growth + margin quality).",
    },
    {
      key: "unit_economics",
      label: "ARR Scale",
      value: unitScore,
      band: bandForScore(unitScore),
      explain: "Strength of LTV/CAC and speed of CAC payback. Investor-critical.",
    },
    {
      key: "capital_efficiency",
      label: "Burn",
      value: capEffScore,
      band: bandForScore(capEffScore),
      explain: "How expensive growth is. Uses Burn Multiple (or burn/ARR proxy). Lower cost = higher score.",
    },
    {
      key: "scalability",
      label: "Gross Margin",
      value: scaleScore,
      band: bandForScore(scaleScore),
      explain: "Ability to scale profitably (margin + operating leverage proxy).",
    },
    {
      key: "risk_posture",
      label: "Risk",
      value: riskPostureScore,
      band: bandForScore(riskPostureScore),
      explain: "Survivability and execution safety (runway + risk containment).",
    },
  ];

  return axes;
}

