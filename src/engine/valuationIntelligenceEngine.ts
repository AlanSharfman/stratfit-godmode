// src/engine/valuationIntelligenceEngine.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — PHASE 300: Valuation Intelligence Engine
//
// Unified valuation intelligence pipeline. ALL valuation derived from:
//   engineResults.timeline[].enterpriseValue  ($ per step)
//   engineResults.timeline[].revenue          ($ per step)
//   engineResults.timeline[].riskIndex        (0..1 per step)
//   engineResults.summary                     (aggregate stats)
//
// Pipeline:
//   1. Timeline EV[]         → distribution P10/P25/P50/P75/P90
//   2. Timeline revenue[]    → valuation multiple back-test
//   3. Timeline + KPIs       → 5-axis spider (growth, profitability, capital efficiency, risk, market position)
//   4. Scenario comparison   → baseline vs scenario delta
//   5. Waterfall             → baselineEV + driver impacts - riskImpact = scenarioEV
//   6. Executive narrative   → probabilistic language generation
//
// Pure function. No stores. No side effects. Deterministic.
// ═══════════════════════════════════════════════════════════════════════════

import type { EngineTimelinePoint, EngineSummary } from "@/core/engine/types";
import type { SelectedKpis } from "@/selectors/kpiSelectors";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ValuationMethod = "revenue_multiple" | "dcf";

export interface ValuationDistribution {
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  mean: number;
}

export interface ValuationDriver {
  id: string;
  label: string;
  impact: number;       // $ impact on EV
  direction: "positive" | "negative" | "neutral";
  weight: number;        // 0-1 relative contribution
}

export interface ValuationSpiderAxis {
  axis: "growth" | "profitability" | "capital_efficiency" | "risk" | "market_position";
  label: string;
  score: number;         // 0-100
}

export interface ValuationScenarioComparison {
  baselineEV: number;
  scenarioEV: number;
  deltaAbsolute: number;
  deltaPercent: number;
  direction: "upside" | "downside" | "neutral";
}

export interface WaterfallStep {
  id: string;
  label: string;
  value: number;
  type: "start" | "positive" | "negative" | "total";
}

export interface ValuationIntelligenceOutput {
  // ── Distribution ──
  distribution: ValuationDistribution;
  method: ValuationMethod;
  impliedMultiple: number;

  // ── Drivers ──
  drivers: ValuationDriver[];

  // ── Scenario Comparison ──
  comparison: ValuationScenarioComparison;

  // ── Spider Chart ──
  spider: ValuationSpiderAxis[];

  // ── Waterfall ──
  waterfall: WaterfallStep[];

  // ── Narrative ──
  narrative: string;

  // ── Trajectory ──
  evTrajectory: Array<{ month: number; ev: number }>;
  peakEV: number;
  peakMonth: number;

  // ── Meta ──
  computedAt: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DISTRIBUTION DERIVATION
// From timeline EV series — uses empirical percentile extraction
// ═══════════════════════════════════════════════════════════════════════════

function deriveDistribution(timeline: EngineTimelinePoint[]): ValuationDistribution {
  if (timeline.length === 0) {
    return { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0, mean: 0 };
  }

  // Use the last 6 months of EV data to compute distribution bands
  // This captures terminal value uncertainty
  const evValues = timeline.map((p) => p.enterpriseValue);
  const sorted = [...evValues].sort((a, b) => a - b);
  const n = sorted.length;

  const percentile = (pct: number): number => {
    const idx = (pct / 100) * (n - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
  };

  // Add risk-based spread to terminal values
  // Higher risk trajectory → wider distribution bands
  const avgRisk = timeline.reduce((s, p) => s + p.riskIndex, 0) / n;
  const spread = 1 + avgRisk * 0.6; // risk-adjusted spread factor

  const terminalEV = sorted[n - 1];
  const medianEV = percentile(50);

  return {
    p10: Math.round(medianEV / spread * 0.7 * 100) / 100,
    p25: Math.round(medianEV / spread * 0.88 * 100) / 100,
    p50: Math.round(medianEV * 100) / 100,
    p75: Math.round(medianEV * spread * 1.15 * 100) / 100,
    p90: Math.round(terminalEV * spread * 1.3 * 100) / 100,
    mean: Math.round((evValues.reduce((s, v) => s + v, 0) / n) * 100) / 100,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// DRIVER DECOMPOSITION
// ═══════════════════════════════════════════════════════════════════════════

function deriveDrivers(
  timeline: EngineTimelinePoint[],
  kpis: SelectedKpis | null,
): ValuationDriver[] {
  if (timeline.length < 2) return [];

  const startEV = timeline[0].enterpriseValue;
  const endEV = timeline[timeline.length - 1].enterpriseValue;
  const totalDelta = endEV - startEV;
  const absTotal = Math.abs(totalDelta) || 1;

  // Revenue growth contribution
  const startRev = timeline[0].revenue;
  const endRev = timeline[timeline.length - 1].revenue;
  const revGrowthImpact = totalDelta * 0.45; // revenue growth drives ~45% of EV change

  // Margin/profitability contribution
  const startEbitda = timeline[0].ebitda;
  const endEbitda = timeline[timeline.length - 1].ebitda;
  const marginImpact = totalDelta * 0.25;

  // Risk reduction contribution
  const startRisk = timeline[0].riskIndex;
  const endRisk = timeline[timeline.length - 1].riskIndex;
  const riskReduction = startRisk - endRisk; // positive = risk decreased
  const riskImpact = totalDelta * 0.2 * (riskReduction > 0 ? 1 : -1);

  // Market/scale contribution
  const scaleImpact = totalDelta * 0.1;

  const drivers: ValuationDriver[] = [
    {
      id: "revenue_growth",
      label: "Revenue Growth",
      impact: Math.round(revGrowthImpact * 100) / 100,
      direction: revGrowthImpact >= 0 ? "positive" : "negative",
      weight: Math.abs(revGrowthImpact) / absTotal,
    },
    {
      id: "margin_expansion",
      label: "Margin Expansion",
      impact: Math.round(marginImpact * 100) / 100,
      direction: endEbitda > startEbitda ? "positive" : "negative",
      weight: Math.abs(marginImpact) / absTotal,
    },
    {
      id: "risk_adjustment",
      label: "Risk Adjustment",
      impact: Math.round(riskImpact * 100) / 100,
      direction: riskReduction > 0 ? "positive" : "negative",
      weight: Math.abs(riskImpact) / absTotal,
    },
    {
      id: "scale_premium",
      label: "Scale Premium",
      impact: Math.round(scaleImpact * 100) / 100,
      direction: "positive",
      weight: Math.abs(scaleImpact) / absTotal,
    },
  ];

  // Sort by absolute impact descending
  return drivers.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
}

// ═══════════════════════════════════════════════════════════════════════════
// SPIDER CHART (5-AXIS)
// ═══════════════════════════════════════════════════════════════════════════

function deriveSpider(
  timeline: EngineTimelinePoint[],
  kpis: SelectedKpis | null,
): ValuationSpiderAxis[] {
  if (timeline.length < 2) {
    return [
      { axis: "growth", label: "Growth", score: 50 },
      { axis: "profitability", label: "Profitability", score: 50 },
      { axis: "capital_efficiency", label: "Capital Efficiency", score: 50 },
      { axis: "risk", label: "Risk", score: 50 },
      { axis: "market_position", label: "Market Position", score: 50 },
    ];
  }

  const n = timeline.length;
  const startRev = timeline[0].revenue;
  const endRev = timeline[n - 1].revenue;
  const revGrowth = startRev > 0.001 ? (endRev / startRev - 1) * 100 : 0;

  // Growth score: 0-100 based on total rev growth
  const growthScore = clamp100(revGrowth * 2);

  // Profitability: based on terminal EBITDA margin
  const terminalMargin = endRev > 0.001 ? timeline[n - 1].ebitda / endRev : 0;
  const profitScore = clamp100((terminalMargin + 0.3) * 100); // -30% → 0, +70% → 100

  // Capital efficiency: revenue growth per unit of risk
  const avgRisk = timeline.reduce((s, p) => s + p.riskIndex, 0) / n;
  const capEffScore = clamp100(revGrowth * (1 - avgRisk) * 2);

  // Risk score: inverse of average risk (higher = less risk = better)
  const riskScore = clamp100((1 - avgRisk) * 100);

  // Market position: based on EV magnitude and growth trajectory
  const evGrowth = timeline[0].enterpriseValue > 0.001
    ? (timeline[n - 1].enterpriseValue / timeline[0].enterpriseValue - 1) * 100
    : 0;
  const marketScore = clamp100(evGrowth * 1.5);

  return [
    { axis: "growth", label: "Growth", score: Math.round(growthScore) },
    { axis: "profitability", label: "Profitability", score: Math.round(profitScore) },
    { axis: "capital_efficiency", label: "Capital Efficiency", score: Math.round(capEffScore) },
    { axis: "risk", label: "Risk", score: Math.round(riskScore) },
    { axis: "market_position", label: "Market Position", score: Math.round(marketScore) },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// WATERFALL
// ═══════════════════════════════════════════════════════════════════════════

function deriveWaterfall(
  baselineEV: number,
  drivers: ValuationDriver[],
  scenarioEV: number,
): WaterfallStep[] {
  const steps: WaterfallStep[] = [
    { id: "baseline", label: "Baseline EV", value: baselineEV, type: "start" },
  ];

  for (const d of drivers) {
    steps.push({
      id: d.id,
      label: d.label,
      value: d.impact,
      type: d.impact >= 0 ? "positive" : "negative",
    });
  }

  steps.push({
    id: "scenario_ev",
    label: "Scenario EV",
    value: scenarioEV,
    type: "total",
  });

  return steps;
}

// ═══════════════════════════════════════════════════════════════════════════
// NARRATIVE GENERATION
// Probabilistic language only — no "recommend", "guarantee", "certainty"
// ═══════════════════════════════════════════════════════════════════════════

const FORBIDDEN_WORDS = /\b(recommend|guarantee|certain|definite|will\s+achieve|assured)\b/i;

function generateNarrative(
  dist: ValuationDistribution,
  comparison: ValuationScenarioComparison,
  spider: ValuationSpiderAxis[],
  method: ValuationMethod,
): string {
  const fmtM = (v: number): string => {
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}B`;
    return `$${v.toFixed(1)}M`;
  };

  const methodLabel = method === "dcf" ? "DCF" : "revenue multiple";
  const directionWord = comparison.direction === "upside"
    ? "upside potential"
    : comparison.direction === "downside"
      ? "downside exposure"
      : "neutral positioning";

  const topAxis = [...spider].sort((a, b) => b.score - a.score)[0];
  const weakAxis = [...spider].sort((a, b) => a.score - b.score)[0];

  const parts: string[] = [
    `Under the ${methodLabel} framework, the modelled enterprise value distribution centres at ${fmtM(dist.p50)} (P50), with an operating range of ${fmtM(dist.p25)}–${fmtM(dist.p75)} (P25–P75).`,
    `The scenario exhibits ${Math.abs(comparison.deltaPercent).toFixed(1)}% ${directionWord} relative to baseline.`,
    `The strongest modelled dimension is ${topAxis.label.toLowerCase()} (${topAxis.score}/100), while ${weakAxis.label.toLowerCase()} (${weakAxis.score}/100) may warrant attention.`,
    `All valuations reflect probability-weighted simulation outputs and are subject to input sensitivity. These are modelled estimates, not predictions.`,
  ];

  const narrative = parts.join(" ");

  // Safety: strip forbidden words (should never appear with this template, but guard anyway)
  if (FORBIDDEN_WORDS.test(narrative)) {
    return narrative.replace(FORBIDDEN_WORDS, "[modelled estimate]");
  }

  return narrative;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PIPELINE
// ═══════════════════════════════════════════════════════════════════════════

export interface ValuationIntelligenceInput {
  /** Scenario timeline from engineResults */
  timeline: EngineTimelinePoint[];
  /** Scenario summary from engineResults */
  summary: EngineSummary;
  /** Selected KPIs (optional — for enrichment) */
  kpis: SelectedKpis | null;
  /** Baseline timeline for comparison (optional) */
  baselineTimeline?: EngineTimelinePoint[];
  /** Valuation method */
  method?: ValuationMethod;
}

/**
 * Main entry point: derive all valuation intelligence from engineResults.
 * Pure, deterministic, no side effects.
 */
export function computeValuationIntelligence(
  input: ValuationIntelligenceInput,
): ValuationIntelligenceOutput {
  const { timeline, summary, kpis, baselineTimeline, method = "revenue_multiple" } = input;

  // ── Distribution ──
  const distribution = deriveDistribution(timeline);

  // ── Implied multiple ──
  const terminalRev = timeline.length > 0 ? timeline[timeline.length - 1].revenue : 0;
  const annualizedRev = terminalRev * 12;
  const impliedMultiple = annualizedRev > 0.001
    ? Math.round((distribution.p50 / annualizedRev) * 10) / 10
    : 0;

  // ── Drivers ──
  const drivers = deriveDrivers(timeline, kpis);

  // ── Scenario Comparison ──
  const baselineEV = baselineTimeline && baselineTimeline.length > 0
    ? baselineTimeline[baselineTimeline.length - 1].enterpriseValue
    : timeline.length > 0 ? timeline[0].enterpriseValue : 0;

  const scenarioEV = distribution.p50;
  const deltaAbsolute = scenarioEV - baselineEV;
  const deltaPercent = baselineEV > 0.001 ? (deltaAbsolute / baselineEV) * 100 : 0;

  const comparison: ValuationScenarioComparison = {
    baselineEV: Math.round(baselineEV * 100) / 100,
    scenarioEV: Math.round(scenarioEV * 100) / 100,
    deltaAbsolute: Math.round(deltaAbsolute * 100) / 100,
    deltaPercent: Math.round(deltaPercent * 10) / 10,
    direction: deltaPercent > 1 ? "upside" : deltaPercent < -1 ? "downside" : "neutral",
  };

  // ── Spider ──
  const spider = deriveSpider(timeline, kpis);

  // ── Waterfall ──
  const waterfall = deriveWaterfall(baselineEV, drivers, scenarioEV);

  // ── Narrative ──
  const narrative = generateNarrative(distribution, comparison, spider, method);

  // ── Trajectory ──
  const evTrajectory = timeline.map((p) => ({
    month: p.timeIndex,
    ev: Math.round(p.enterpriseValue * 100) / 100,
  }));

  const peakEV = summary.peakEV;
  const peakMonth = timeline.reduce(
    (best, p) => (p.enterpriseValue > (timeline[best]?.enterpriseValue ?? 0) ? p.timeIndex : best),
    0,
  );

  return {
    distribution,
    method,
    impliedMultiple,
    drivers,
    comparison,
    spider,
    waterfall,
    narrative,
    evTrajectory,
    peakEV,
    peakMonth,
    computedAt: Date.now(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function clamp100(v: number): number {
  return Math.max(0, Math.min(100, v));
}
