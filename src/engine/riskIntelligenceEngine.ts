// src/engine/riskIntelligenceEngine.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — PHASE 300: Risk Intelligence Engine
//
// Unified risk intelligence pipeline. ALL risk derived strictly from:
//   engineResults.timeline[].riskIndex   (0..1 per step)
//
// Pipeline:
//   1. Timeline riskIndex[]         → overall score, trajectory, peaks
//   2. mapScenarioIntelligence()    → qualitative intel (observations, risks, flags)
//   3. Timeline + KPIs             → 6-axis threat radar
//   4. Timeline riskIndex           → survival probability
//
// Pure function. No stores. No side effects. Deterministic.
// ═══════════════════════════════════════════════════════════════════════════

import type { SelectedKpis } from "@/selectors/kpiSelectors";
import type { EngineTimelinePoint } from "@/core/engine/types";
import {
  mapScenarioIntelligence,
  type ScenarioMetricsSnapshot,
  type ScenarioIntelligenceOutput,
  type SystemStateLevel,
} from "@/utils/scenarioIntelligenceMapping";
import type { SimulationKpis } from "@/state/phase1ScenarioStore";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type RiskBand = "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "CRITICAL";

export interface ThreatAxis {
  category: "runway" | "market" | "execution" | "competition" | "funding" | "churn";
  label: string;
  score: number;              // 0-100
  trend: "improving" | "stable" | "worsening";
}

export interface RiskTrajectoryPoint {
  month: number;
  score: number;              // 0-100
}

export interface RiskIntelligenceOutput {
  // ── Quantitative (from timeline riskIndex) ──
  overallScore: number;       // 0-100
  band: RiskBand;
  bandColor: string;
  survivalProbability: number; // 0-1

  // ── Radar / Threat Shape ──
  threatAxes: ThreatAxis[];

  // ── Trajectory (from timeline riskIndex) ──
  trajectory: RiskTrajectoryPoint[];
  peakRisk: number;           // highest score in trajectory
  peakMonth: number;          // month of peak

  // ── Top Threats (ranked) ──
  topThreats: Array<{
    rank: number;
    title: string;
    severity: SystemStateLevel;
    driver: string;
    impact: string;
  }>;

  // ── Qualitative Intelligence (from mapping) ──
  systemState: {
    financial: SystemStateLevel;
    operational: SystemStateLevel;
    execution: SystemStateLevel;
  };
  observations: string[];
  attention: string[];
  assumptionFlags: string[];
  strategicQuestions: Array<{ question: string; answer: string }>;

  // ── Meta ──
  computedAt: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// RISK BAND UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export function getRiskBand(score: number): RiskBand {
  if (score <= 20) return "LOW";
  if (score <= 40) return "MODERATE";
  if (score <= 60) return "ELEVATED";
  if (score <= 80) return "HIGH";
  return "CRITICAL";
}

export function getRiskBandColor(band: RiskBand): string {
  switch (band) {
    case "LOW":       return "#22d3ee";
    case "MODERATE":  return "#34d399";
    case "ELEVATED":  return "#fbbf24";
    case "HIGH":      return "#f97316";
    case "CRITICAL":  return "#ef4444";
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TIMELINE → RISK DERIVATION
// All risk scores derived strictly from engineResults.timeline[].riskIndex
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build EngineTimelinePoint[] from flat KPIs when no engine timeline
 * is available. Deterministic per-month projection matching
 * generateSimulationEvents.projectTimeSeries formulas.
 */
export function buildTimelineFromKpis(
  kpis: SimulationKpis,
  horizonMonths: number,
): EngineTimelinePoint[] {
  const T = Math.max(1, horizonMonths);
  const points: EngineTimelinePoint[] = [];

  const monthlyGrowth = Math.abs(kpis.growthRate) <= 1
    ? kpis.growthRate : kpis.growthRate / 100;
  const monthlyChurn = Math.abs(kpis.churnRate) <= 1
    ? kpis.churnRate : kpis.churnRate / 100;
  const grossMargin = Math.abs(kpis.grossMargin) <= 1
    ? kpis.grossMargin : kpis.grossMargin / 100;

  let cash = kpis.cash;
  const burn = kpis.monthlyBurn;

  for (let t = 0; t < T; t++) {
    const netGrowth = monthlyGrowth - monthlyChurn;
    const rev = Math.max(kpis.revenue * Math.pow(1 + netGrowth, t), 0);

    // Cash: revenue * margin - burn, cumulative
    const netCashFlow = rev * grossMargin - burn;
    cash = Math.max(cash + netCashFlow, 0);
    const runway = burn > 0.001 ? cash / burn : T;

    // Risk index: composite (matches generateSimulationEvents formula)
    const burnRatio = rev > 0.001 ? burn / rev : 2;
    const burnPressure = clamp01((burnRatio - 0.5) / 1.5);
    const marginRisk = clamp01((0.6 - grossMargin) / 0.4);
    const churnRisk = clamp01((monthlyChurn - 0.02) / 0.08);
    const runwayRisk = runway < T ? clamp01((12 - runway) / 12) : 0;
    const riskIndex = clamp01(
      burnPressure * 0.35 + marginRisk * 0.2 + churnRisk * 0.2 + runwayRisk * 0.25,
    );

    // EBITDA
    const ebitda = rev * grossMargin - burn;

    // Enterprise value (simple revenue multiple)
    const growthMult = monthlyGrowth > 0 ? 8 + monthlyGrowth * 40 : 5;
    const ev = rev * 12 * growthMult / 12; // annual-adjusted

    points.push({
      timeIndex: t,
      revenue: Math.round(rev * 100) / 100,
      ebitda: Math.round(ebitda * 100) / 100,
      riskIndex: Math.round(riskIndex * 1000) / 1000,
      enterpriseValue: Math.round(ev * 100) / 100,
    });
  }

  return points;
}

/**
 * Derive overall risk score from timeline riskIndex (0..1 → 0..100).
 * Uses weighted average: 60% current (last point), 40% trailing average.
 */
function deriveOverallScoreFromTimeline(timeline: EngineTimelinePoint[]): number {
  if (timeline.length === 0) return 50;

  const current = timeline[timeline.length - 1].riskIndex;
  const avg = timeline.reduce((s, p) => s + p.riskIndex, 0) / timeline.length;

  // Weight current state heavier than historical average
  const blended = current * 0.6 + avg * 0.4;
  return Math.round(clamp01(blended) * 100);
}

/**
 * Build trajectory directly from timeline[].riskIndex.
 * Maps each timeline point to { month, score 0-100 }.
 */
function trajectoryFromTimeline(timeline: EngineTimelinePoint[]): RiskTrajectoryPoint[] {
  return timeline.map((p) => ({
    month: p.timeIndex,
    score: Math.round(clamp01(p.riskIndex) * 100),
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// THREAT AXIS DERIVATION — 6-axis radar from KPIs + timeline trends
// ═══════════════════════════════════════════════════════════════════════════

function deriveThreatAxes(
  kpis: SelectedKpis,
  riskScore: number,
  timeline: EngineTimelinePoint[],
): ThreatAxis[] {
  const runway = kpis.runwayMonths ?? 24;
  const burn = kpis.burnMonthly;
  const rev = kpis.revenue;
  const gm = kpis.grossMargin;
  const growth = kpis.growthRate;
  const churn = kpis.churnRate;

  // Runway Risk: lower runway = higher risk
  const runwayRisk = runway >= 24 ? 12 : runway >= 18 ? 25 : runway >= 12 ? 42 : runway >= 6 ? 65 : 85;

  // Market Risk: inversely proportional to growth
  const normalizedGrowth = Math.abs(growth) > 1 ? growth : growth * 100;
  const marketRisk = normalizedGrowth >= 30 ? 15 : normalizedGrowth >= 15 ? 30 : normalizedGrowth >= 5 ? 50 : normalizedGrowth >= 0 ? 65 : 80;

  // Execution Risk: composite of timeline riskIndex + margin pressure
  const execRisk = Math.min(100, Math.round(riskScore * 0.6 + (100 - Math.min(gm, 100)) * 0.4));

  // Competition Risk: derived from growth deceleration + margin compression
  const compRisk = Math.round(
    (normalizedGrowth < 10 ? 60 : normalizedGrowth < 20 ? 40 : 20) * 0.5 +
    (gm < 50 ? 55 : gm < 65 ? 35 : 15) * 0.5
  );

  // Funding Risk: burn/revenue ratio + runway
  const burnRatio = rev > 0 ? burn / rev : 5;
  const fundingBase = burnRatio > 3 ? 80 : burnRatio > 2 ? 60 : burnRatio > 1.2 ? 40 : 20;
  const fundingRisk = Math.min(100, Math.round(fundingBase * 0.6 + (100 - Math.min(runway / 24 * 100, 100)) * 0.4));

  // Churn Risk: direct from churn rate
  const normalizedChurn = Math.abs(churn) > 1 ? churn : churn * 100;
  const churnRisk = normalizedChurn >= 8 ? 80 : normalizedChurn >= 5 ? 60 : normalizedChurn >= 3 ? 40 : normalizedChurn >= 1 ? 25 : 12;

  // Trend derivation from actual timeline riskIndex direction
  const deriveTrend = (axisScore: number): "improving" | "stable" | "worsening" => {
    if (timeline.length < 4) {
      return axisScore <= 30 ? "improving" : axisScore <= 60 ? "stable" : "worsening";
    }
    // Compare first-half avg vs second-half avg riskIndex for trend direction
    const mid = Math.floor(timeline.length / 2);
    const firstHalf = timeline.slice(0, mid).reduce((s, p) => s + p.riskIndex, 0) / mid;
    const secondHalf = timeline.slice(mid).reduce((s, p) => s + p.riskIndex, 0) / (timeline.length - mid);
    const delta = secondHalf - firstHalf;
    if (delta > 0.05) return "worsening";
    if (delta < -0.05) return "improving";
    return "stable";
  };

  return [
    { category: "runway",      label: "Runway",       score: runwayRisk,  trend: deriveTrend(runwayRisk)  },
    { category: "market",      label: "Market",       score: marketRisk,  trend: deriveTrend(marketRisk)  },
    { category: "execution",   label: "Execution",    score: execRisk,    trend: deriveTrend(execRisk)    },
    { category: "competition", label: "Competition",  score: compRisk,    trend: deriveTrend(compRisk)    },
    { category: "funding",     label: "Funding",      score: fundingRisk, trend: deriveTrend(fundingRisk) },
    { category: "churn",       label: "Churn",        score: churnRisk,   trend: deriveTrend(churnRisk)   },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ENGINE — computeRiskIntelligence
// ═══════════════════════════════════════════════════════════════════════════

export interface RiskIntelligenceInputs {
  simulationKpis: SimulationKpis | null;
  selectedKpis: SelectedKpis | null;
  /** Engine timeline — primary risk source. Falls back to KPI projection. */
  timeline?: EngineTimelinePoint[] | null;
  /** Horizon months for KPI fallback timeline generation */
  horizonMonths?: number;
  baselineKpis?: SelectedKpis | null;
}

export function computeRiskIntelligence(
  inputs: RiskIntelligenceInputs,
): RiskIntelligenceOutput | null {
  const { simulationKpis, selectedKpis, baselineKpis } = inputs;

  if (!selectedKpis || !simulationKpis) return null;

  // ── 1. Resolve timeline — strict source for all risk ─────────
  const horizon = inputs.horizonMonths ?? 24;
  const timeline: EngineTimelinePoint[] =
    inputs.timeline && inputs.timeline.length > 0
      ? inputs.timeline
      : buildTimelineFromKpis(simulationKpis, horizon);

  // ── 2. Overall risk score from timeline[].riskIndex ──────────
  const overallScore = deriveOverallScoreFromTimeline(timeline);
  const band = getRiskBand(overallScore);
  const bandColor = getRiskBandColor(band);

  // ── 3. Survival probability from timeline riskIndex ──────────
  const currentRisk = timeline[timeline.length - 1]?.riskIndex ?? 0.5;
  const survivalProbability = clamp01(1 - currentRisk * 0.85);

  // ── 4. Threat axes (KPIs + timeline trend) ───────────────────
  const threatAxes = deriveThreatAxes(selectedKpis, overallScore, timeline);

  // ── 5. Trajectory directly from timeline[].riskIndex ─────────
  const trajectory = trajectoryFromTimeline(timeline);
  const peakPoint = trajectory.reduce(
    (max, p) => (p.score > max.score ? p : max),
    trajectory[0] ?? { month: 0, score: 0 },
  );

  // ── 6. Intelligence mapping — qualitative outputs ────────────
  const metricsSnapshot: ScenarioMetricsSnapshot = {
    runwayMonths: selectedKpis.runwayMonths ?? 24,
    cashPosition: selectedKpis.cashOnHand,
    burnRateMonthly: selectedKpis.burnMonthly,
    arr: selectedKpis.arr,
    arrGrowthPct: Math.abs(selectedKpis.growthRate) > 1 ? selectedKpis.growthRate : selectedKpis.growthRate * 100,
    grossMarginPct: Math.abs(selectedKpis.grossMargin) > 1 ? selectedKpis.grossMargin : selectedKpis.grossMargin * 100,
    riskScore: overallScore,
    enterpriseValue: selectedKpis.valuation ?? 0,
  };

  // Baseline snapshot for delta comparison
  const baselineSnapshot: ScenarioMetricsSnapshot = baselineKpis
    ? {
        runwayMonths: baselineKpis.runwayMonths ?? 24,
        cashPosition: baselineKpis.cashOnHand,
        burnRateMonthly: baselineKpis.burnMonthly,
        arr: baselineKpis.arr,
        arrGrowthPct: Math.abs(baselineKpis.growthRate) > 1 ? baselineKpis.growthRate : baselineKpis.growthRate * 100,
        grossMarginPct: Math.abs(baselineKpis.grossMargin) > 1 ? baselineKpis.grossMargin : baselineKpis.grossMargin * 100,
        riskScore: 50,
        enterpriseValue: baselineKpis.valuation ?? 0,
      }
    : metricsSnapshot;

  const intelligence: ScenarioIntelligenceOutput = mapScenarioIntelligence({
    current: metricsSnapshot,
    baseline: baselineSnapshot,
  });

  // ── 7. Build top threats from intelligence risks ─────────────
  const topThreats = intelligence.risks.map((r, i) => ({
    rank: i + 1,
    title: r.title,
    severity: r.severity,
    driver: r.driver,
    impact: r.impact,
  }));

  return {
    overallScore,
    band,
    bandColor,
    survivalProbability,
    threatAxes,
    trajectory,
    peakRisk: peakPoint.score,
    peakMonth: peakPoint.month,
    topThreats,
    systemState: intelligence.systemState,
    observations: intelligence.observations,
    attention: intelligence.attention,
    assumptionFlags: intelligence.assumptionFlags,
    strategicQuestions: intelligence.strategicQuestions ?? [],
    computedAt: Date.now(),
  };
}
