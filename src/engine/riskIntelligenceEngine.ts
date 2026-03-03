// src/engine/riskIntelligenceEngine.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — PHASE 300: Risk Intelligence Engine
//
// Unified risk intelligence pipeline. Combines:
//   1. selectRiskScore()            → overall 0-100 score
//   2. mapScenarioIntelligence()    → qualitative intel (observations, risks, flags)
//   3. Engine timeline riskIndex[]  → risk trajectory sparkline
//   4. Derived threat factors       → 6-axis radar (runway, market, execution, competition, funding, churn)
//
// Pure function. No stores. No side effects. Deterministic.
// ═══════════════════════════════════════════════════════════════════════════

import type { SelectedKpis } from "@/selectors/kpiSelectors";
import { selectRiskScore } from "@/selectors/riskSelectors";
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
  // ── Quantitative ──
  overallScore: number;       // 0-100
  band: RiskBand;
  bandColor: string;
  survivalProbability: number; // 0-1

  // ── Radar / Threat Shape ──
  threatAxes: ThreatAxis[];

  // ── Trajectory ──
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
// THREAT AXIS DERIVATION — 6-axis radar from KPIs
// ═══════════════════════════════════════════════════════════════════════════

function deriveThreatAxes(kpis: SelectedKpis, riskScore: number): ThreatAxis[] {
  const runway = kpis.runwayMonths ?? 24;
  const burn = kpis.burnMonthly;
  const rev = kpis.revenue;
  const gm = kpis.grossMargin; // 0-100
  const growth = kpis.growthRate; // 0-100 or decimal
  const churn = kpis.churnRate;

  // Runway Risk: lower runway = higher risk
  const runwayRisk = runway >= 24 ? 12 : runway >= 18 ? 25 : runway >= 12 ? 42 : runway >= 6 ? 65 : 85;

  // Market Risk: inversely proportional to growth
  const normalizedGrowth = Math.abs(growth) > 1 ? growth : growth * 100;
  const marketRisk = normalizedGrowth >= 30 ? 15 : normalizedGrowth >= 15 ? 30 : normalizedGrowth >= 5 ? 50 : normalizedGrowth >= 0 ? 65 : 80;

  // Execution Risk: composite of risk score + margin pressure
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

  // Trend derivation: based on score magnitude
  const trend = (score: number): "improving" | "stable" | "worsening" =>
    score <= 30 ? "improving" : score <= 60 ? "stable" : "worsening";

  return [
    { category: "runway",      label: "Runway",       score: runwayRisk,  trend: trend(runwayRisk)  },
    { category: "market",      label: "Market",       score: marketRisk,  trend: trend(marketRisk)  },
    { category: "execution",   label: "Execution",    score: execRisk,    trend: trend(execRisk)    },
    { category: "competition", label: "Competition",  score: compRisk,    trend: trend(compRisk)    },
    { category: "funding",     label: "Funding",      score: fundingRisk, trend: trend(fundingRisk) },
    { category: "churn",       label: "Churn",        score: churnRisk,   trend: trend(churnRisk)   },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// TRAJECTORY PROJECTION — 36-month forward risk curve
// ═══════════════════════════════════════════════════════════════════════════

function projectTrajectory(baseScore: number, kpis: SelectedKpis): RiskTrajectoryPoint[] {
  const points: RiskTrajectoryPoint[] = [];
  const runway = kpis.runwayMonths ?? 24;
  const growth = Math.abs(kpis.growthRate) > 1 ? kpis.growthRate / 100 : kpis.growthRate;

  for (let m = 0; m <= 36; m++) {
    // Risk increases as runway shortens, moderated by growth
    const runwayAtM = Math.max(0, runway - m);
    const runwayPressure = runwayAtM < 6 ? 30 : runwayAtM < 12 ? 15 : runwayAtM < 18 ? 5 : 0;

    // Growth dampening effect (positive growth reduces risk over time)
    const growthDamping = growth > 0 ? -growth * m * 0.8 : Math.abs(growth) * m * 1.2;

    // Bell-curve mid-journey stress
    const t = m / 36;
    const midStress = Math.exp(-0.5 * ((t - 0.45) / 0.15) ** 2) * 12;

    const score = Math.max(0, Math.min(100, baseScore + runwayPressure + growthDamping + midStress));
    points.push({ month: m, score: Math.round(score) });
  }

  return points;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ENGINE — computeRiskIntelligence
// ═══════════════════════════════════════════════════════════════════════════

export interface RiskIntelligenceInputs {
  simulationKpis: SimulationKpis | null;
  selectedKpis: SelectedKpis | null;
  engineRunId?: string;
  baselineKpis?: SelectedKpis | null;
}

export function computeRiskIntelligence(
  inputs: RiskIntelligenceInputs,
): RiskIntelligenceOutput | null {
  const { simulationKpis, selectedKpis, engineRunId, baselineKpis } = inputs;

  if (!selectedKpis || !simulationKpis) return null;

  // 1. Overall risk score
  const overallScore = selectRiskScore(simulationKpis, engineRunId);
  const band = getRiskBand(overallScore);
  const bandColor = getRiskBandColor(band);

  // 2. Survival probability (inverse of normalized risk)
  const survivalProbability = Math.max(0, Math.min(1, 1 - (overallScore / 100) * 0.85));

  // 3. Threat axes
  const threatAxes = deriveThreatAxes(selectedKpis, overallScore);

  // 4. Trajectory
  const trajectory = projectTrajectory(overallScore, selectedKpis);
  const peakPoint = trajectory.reduce((max, p) => (p.score > max.score ? p : max), trajectory[0]);

  // 5. Intelligence mapping — qualitative outputs
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
    : metricsSnapshot; // Self-compare when no baseline available

  const intelligence: ScenarioIntelligenceOutput = mapScenarioIntelligence({
    current: metricsSnapshot,
    baseline: baselineSnapshot,
  });

  // 6. Build top threats from intelligence risks
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
