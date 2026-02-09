// src/logic/intelligence/generateCommentary.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Deterministic System Commentary Generator
// Produces structured commentary blocks from engine results + simulation data.
// RULES:
//   • No hardcoded prose — every string is derived from metrics.
//   • No "AI" labeling — this is deterministic system output.
//   • No engine internals exposed (seeds, iteration counts, etc.).
//   • Cited metrics in every block (p10/p50/p90, survival%, runway, etc.).
// ═══════════════════════════════════════════════════════════════════════════

import type { MonteCarloResult, SensitivityFactor } from "@/logic/monteCarloEngine";
import type { Verdict } from "@/logic/verdictGenerator";
import type { EngineResult, KPIValue } from "@/state/scenarioStore";
import type { SimulationSummary, AssessmentPayload } from "@/state/simulationStore";

// ────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────

export interface CommentaryBlock {
  id: string;
  title: string;
  severity: "positive" | "neutral" | "warning" | "critical";
  claim: string;
  metrics?: Array<{ label: string; value: string; delta?: string }>;
}

export interface CommentaryInput {
  /** Full Monte Carlo result (in-memory, may be null after navigation) */
  simulationResult: MonteCarloResult | null;
  /** Verdict derived from simulation */
  verdict: Verdict | null;
  /** Persisted assessment payload (survives navigation) */
  assessmentPayload: AssessmentPayload | null;
  /** Pre-computed summary */
  summary: SimulationSummary | null;
  /** Scenario engine results (always available when baseline exists) */
  engineResult: EngineResult | null;
  /** Base scenario engine results (for delta computation) */
  baseEngineResult: EngineResult | null;
}

export interface CommentaryOutput {
  source: "simulation" | "engine" | "empty";
  blocks: CommentaryBlock[];
}

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

function fmtUsd(v: number): string {
  if (Math.abs(v) >= 1_000_000) return "$" + (v / 1_000_000).toFixed(1) + "M";
  if (Math.abs(v) >= 1_000) return "$" + (v / 1_000).toFixed(0) + "K";
  return "$" + Math.round(v).toLocaleString();
}

function fmtPct(v: number, decimals = 0): string {
  return (v * 100).toFixed(decimals) + "%";
}

function fmtMo(v: number): string {
  return Math.round(v) + "mo";
}

function kpiVal(kpi: KPIValue | undefined): number {
  return kpi?.value ?? 0;
}

function severityFromScore(score: number, thresholds: [number, number]): "positive" | "neutral" | "warning" | "critical" {
  if (score >= thresholds[0]) return "positive";
  if (score >= thresholds[1]) return "neutral";
  return score < thresholds[1] * 0.5 ? "critical" : "warning";
}

// ────────────────────────────────────────────────────────────────────────────
// SIMULATION-BASED COMMENTARY
// ────────────────────────────────────────────────────────────────────────────

function fromSimulation(
  result: MonteCarloResult | null,
  verdict: Verdict | null,
  payload: AssessmentPayload | null,
  summary: SimulationSummary | null,
): CommentaryBlock[] {
  const blocks: CommentaryBlock[] = [];

  // Use full result if in-memory; otherwise fall back to persisted payload
  const survivalRate = result?.survivalRate ?? payload?.survivalRate ?? 0;
  const arrP10 = result?.arrPercentiles.p10 ?? payload?.arrPercentiles.p10 ?? 0;
  const arrP50 = result?.arrPercentiles.p50 ?? payload?.arrPercentiles.p50 ?? 0;
  const arrP90 = result?.arrPercentiles.p90 ?? payload?.arrPercentiles.p90 ?? 0;
  const runwayP10 = result?.runwayPercentiles.p10 ?? payload?.runwayPercentiles.p10 ?? 0;
  const runwayP50 = result?.runwayPercentiles.p50 ?? payload?.runwayPercentiles.p50 ?? 0;
  const runwayP90 = result?.runwayPercentiles.p90 ?? payload?.runwayPercentiles.p90 ?? 0;
  const cashP10 = result?.cashPercentiles.p10 ?? payload?.cashPercentiles.p10 ?? 0;
  const cashP50 = result?.cashPercentiles.p50 ?? payload?.cashPercentiles.p50 ?? 0;
  const cashP90 = result?.cashPercentiles.p90 ?? payload?.cashPercentiles.p90 ?? 0;
  const sensitivityFactors = result?.sensitivityFactors ?? payload?.sensitivityFactors ?? [];

  // 1. SURVIVAL POSTURE
  const survivalSeverity = survivalRate >= 0.8 ? "positive" : survivalRate >= 0.5 ? "neutral" : survivalRate >= 0.3 ? "warning" : "critical";
  blocks.push({
    id: "survival",
    title: "Survival Posture",
    severity: survivalSeverity,
    claim: survivalRate >= 0.8
      ? `Structural survival probability is strong at ${fmtPct(survivalRate)}. The business sustains across most simulated futures.`
      : survivalRate >= 0.5
        ? `Survival probability is moderate at ${fmtPct(survivalRate)}. Approximately half of simulated paths reach terminal horizon.`
        : `Survival probability is critically low at ${fmtPct(survivalRate)}. Immediate capital or efficiency action required.`,
    metrics: [
      { label: "Survival", value: fmtPct(survivalRate) },
      { label: "Median runway", value: fmtMo(runwayP50) },
      { label: "Stress runway (P10)", value: fmtMo(runwayP10) },
    ],
  });

  // 2. REVENUE DISTRIBUTION
  const arrSpread = arrP50 > 0 ? (arrP90 - arrP10) / arrP50 : 0;
  const arrSeverity = arrSpread < 0.5 ? "positive" : arrSpread < 1.0 ? "neutral" : "warning";
  blocks.push({
    id: "revenue",
    title: "Revenue Distribution",
    severity: arrSeverity,
    claim: arrSpread < 0.5
      ? `Revenue outcomes are tightly distributed around ${fmtUsd(arrP50)}. Low dispersion indicates predictable growth trajectory.`
      : arrSpread < 1.0
        ? `Revenue range spans ${fmtUsd(arrP10)} to ${fmtUsd(arrP90)} with a median of ${fmtUsd(arrP50)}. Moderate uncertainty in growth path.`
        : `Wide revenue dispersion detected: P10 at ${fmtUsd(arrP10)} vs P90 at ${fmtUsd(arrP90)}. High sensitivity to execution and market factors.`,
    metrics: [
      { label: "P10", value: fmtUsd(arrP10) },
      { label: "P50 (Median)", value: fmtUsd(arrP50) },
      { label: "P90", value: fmtUsd(arrP90) },
    ],
  });

  // 3. CAPITAL POSITION
  const cashSeverity = cashP10 > 0 ? (cashP50 > 500_000 ? "positive" : "neutral") : "critical";
  blocks.push({
    id: "capital",
    title: "Capital Position",
    severity: cashSeverity,
    claim: cashP10 > 0
      ? `Median terminal cash is ${fmtUsd(cashP50)}. Even under stress (P10), the business retains ${fmtUsd(cashP10)} in reserves.`
      : `Stress scenarios (P10) show negative cash position at ${fmtUsd(cashP10)}. Capital injection or burn reduction likely required.`,
    metrics: [
      { label: "Cash P10", value: fmtUsd(cashP10) },
      { label: "Cash P50", value: fmtUsd(cashP50) },
      { label: "Cash P90", value: fmtUsd(cashP90) },
    ],
  });

  // 4. RUNWAY HORIZON
  const runwaySeverity = runwayP50 >= 24 ? "positive" : runwayP50 >= 12 ? "neutral" : runwayP50 >= 6 ? "warning" : "critical";
  blocks.push({
    id: "runway",
    title: "Runway Horizon",
    severity: runwaySeverity,
    claim: runwayP50 >= 24
      ? `Median runway of ${fmtMo(runwayP50)} provides strategic flexibility for growth investment.`
      : runwayP50 >= 12
        ? `Runway at ${fmtMo(runwayP50)} is adequate. Plan next funding round or path to profitability within 6 months.`
        : `Runway compression: median ${fmtMo(runwayP50)}, stress case ${fmtMo(runwayP10)}. Immediate intervention required.`,
    metrics: [
      { label: "P10", value: fmtMo(runwayP10) },
      { label: "Median", value: fmtMo(runwayP50) },
      { label: "P90", value: fmtMo(runwayP90) },
    ],
  });

  // 5. SENSITIVITY DRIVERS
  const topDrivers = [...sensitivityFactors]
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 3);

  if (topDrivers.length > 0) {
    const topLabel = topDrivers[0].label;
    const topImpact = topDrivers[0].impact;
    blocks.push({
      id: "sensitivity",
      title: "Key Sensitivity Drivers",
      severity: Math.abs(topImpact) > 0.5 ? "warning" : "neutral",
      claim: `"${topLabel}" is the dominant driver of outcome variance (impact: ${(topImpact * 100).toFixed(0)}%). ${topDrivers.length > 1 ? `Followed by "${topDrivers[1].label}" and "${topDrivers[2]?.label ?? "—"}".` : ""}`,
      metrics: topDrivers.map((d) => ({
        label: d.label,
        value: (d.impact > 0 ? "+" : "") + (d.impact * 100).toFixed(0) + "%",
        delta: d.direction,
      })),
    });
  }

  // 6. VERDICT SUMMARY (from verdictGenerator if available)
  if (verdict) {
    const verdictSeverity =
      verdict.overallRating === "EXCEPTIONAL" || verdict.overallRating === "STRONG"
        ? "positive"
        : verdict.overallRating === "STABLE"
          ? "neutral"
          : verdict.overallRating === "CAUTION"
            ? "warning"
            : "critical";

    blocks.push({
      id: "verdict",
      title: "System Verdict",
      severity: verdictSeverity,
      claim: verdict.headline + (verdict.summary ? " " + verdict.summary : ""),
      metrics: [
        { label: "Rating", value: verdict.overallRating },
        { label: "Score", value: verdict.overallScore + "/100" },
        { label: "Confidence", value: verdict.confidenceLevel },
      ],
    });

    // 7. PRIMARY RISK
    if (verdict.primaryRisk) {
      blocks.push({
        id: "risk",
        title: "Primary Risk",
        severity: "warning",
        claim: verdict.primaryRisk + (verdict.riskMitigation ? " " + verdict.riskMitigation : ""),
      });
    }

    // 8. TOP RECOMMENDATION
    if (verdict.recommendations.length > 0) {
      const rec = verdict.recommendations[0];
      blocks.push({
        id: "recommendation",
        title: "Priority Action",
        severity: rec.priority === "CRITICAL" ? "critical" : rec.priority === "HIGH" ? "warning" : "neutral",
        claim: rec.action + (rec.rationale ? " — " + rec.rationale : ""),
        metrics: [
          { label: "Category", value: rec.category },
          { label: "Impact", value: rec.impact },
        ],
      });
    }
  }

  return blocks;
}

// ────────────────────────────────────────────────────────────────────────────
// ENGINE-BASED FALLBACK COMMENTARY (no simulation run yet)
// ────────────────────────────────────────────────────────────────────────────

function fromEngine(
  current: EngineResult | null,
  base: EngineResult | null,
): CommentaryBlock[] {
  if (!current) return [];

  const blocks: CommentaryBlock[] = [];
  const kpis = current.kpis;
  const baseKpis = base?.kpis;

  const runway = kpiVal(kpis.runway);
  const riskScore = kpiVal(kpis.riskScore);
  const burnQuality = kpiVal(kpis.burnQuality);
  const ev = kpiVal(kpis.enterpriseValue);
  const ltvCac = kpiVal(kpis.ltvCac);
  const momentum = kpiVal(kpis.momentum);
  const qualityScore = kpiVal(kpis.qualityScore);
  const arrGrowth = kpiVal(kpis.arrGrowthPct);

  const baseRunway = kpiVal(baseKpis?.runway);
  const baseRisk = kpiVal(baseKpis?.riskScore);
  const baseEv = kpiVal(baseKpis?.enterpriseValue);

  // 1. OPERATIONAL POSTURE
  const runwaySeverity = severityFromScore(runway, [24, 12]);
  blocks.push({
    id: "posture",
    title: "Operational Posture",
    severity: runwaySeverity,
    claim: runway >= 24
      ? `Runway at ${Math.round(runway)} months provides strategic flexibility. Capital reserves support continued execution.`
      : runway >= 12
        ? `Runway at ${Math.round(runway)} months is adequate. Active monitoring of capital efficiency recommended.`
        : `Runway compression at ${Math.round(runway)} months. Immediate cost review or capital action required.`,
    metrics: [
      { label: "Runway", value: fmtMo(runway), delta: baseRunway ? (runway > baseRunway ? "+" + fmtMo(runway - baseRunway) : fmtMo(runway - baseRunway)) : undefined },
      { label: "Burn Quality", value: Math.round(burnQuality) + "/100" },
    ],
  });

  // 2. RISK EXPOSURE
  const riskSeverity = riskScore < 35 ? "positive" : riskScore < 65 ? "neutral" : "warning";
  blocks.push({
    id: "risk",
    title: "Risk Exposure",
    severity: riskSeverity,
    claim: riskScore < 35
      ? `Risk profile is well-contained at ${Math.round(riskScore)}/100. Defensive posture maintained.`
      : riskScore < 65
        ? `Moderate risk exposure at ${Math.round(riskScore)}/100. Monitor execution variables.`
        : `Elevated risk at ${Math.round(riskScore)}/100. Capital efficiency requires attention.`,
    metrics: [
      { label: "Risk Score", value: Math.round(riskScore) + "/100", delta: baseRisk ? (riskScore < baseRisk ? (riskScore - baseRisk).toFixed(0) : "+" + (riskScore - baseRisk).toFixed(0)) : undefined },
    ],
  });

  // 3. GROWTH SIGNALS
  if (arrGrowth !== 0 || momentum !== 0) {
    const growthSeverity = arrGrowth > 20 ? "positive" : arrGrowth > 0 ? "neutral" : "warning";
    blocks.push({
      id: "growth",
      title: "Growth Signals",
      severity: growthSeverity,
      claim: arrGrowth > 20
        ? `Strong revenue momentum at ${arrGrowth.toFixed(0)}% growth. Trajectory supports scaling investment.`
        : arrGrowth > 0
          ? `Positive growth trajectory at ${arrGrowth.toFixed(0)}%. Steady execution maintaining customer acquisition pace.`
          : arrGrowth < 0
            ? `Revenue contraction detected at ${arrGrowth.toFixed(0)}%. Pipeline conversion and churn analysis recommended.`
            : `Flat revenue trajectory. Growth levers require activation.`,
      metrics: [
        { label: "ARR Growth", value: arrGrowth.toFixed(1) + "%" },
        ...(momentum ? [{ label: "Momentum", value: Math.round(momentum) + "/100" }] : []),
      ],
    });
  }

  // 4. CUSTOMER ECONOMICS
  if (ltvCac > 0) {
    const ltvSeverity = ltvCac >= 3 ? "positive" : ltvCac >= 1.5 ? "neutral" : "warning";
    blocks.push({
      id: "economics",
      title: "Customer Economics",
      severity: ltvSeverity,
      claim: ltvCac >= 3
        ? `LTV/CAC ratio of ${ltvCac.toFixed(1)}x indicates efficient customer acquisition. Unit economics support growth.`
        : `LTV/CAC at ${ltvCac.toFixed(1)}x is below the 3x threshold. Customer acquisition cost-intensive.`,
      metrics: [
        { label: "LTV/CAC", value: ltvCac.toFixed(1) + "x" },
      ],
    });
  }

  // 5. VALUATION SIGNAL
  if (ev > 0) {
    const evFormatted = fmtUsd(ev * 100_000); // ev is scaled in engine
    const evDelta = baseEv > 0 ? ((ev - baseEv) / baseEv) * 100 : 0;
    blocks.push({
      id: "valuation",
      title: "Valuation Signal",
      severity: evDelta > 0 ? "positive" : evDelta < -10 ? "warning" : "neutral",
      claim: `Enterprise value estimate at ${evFormatted}.${evDelta !== 0 ? ` ${evDelta > 0 ? "+" : ""}${evDelta.toFixed(1)}% vs baseline.` : ""}`,
      metrics: [
        { label: "EV Estimate", value: evFormatted },
        ...(evDelta !== 0 ? [{ label: "Delta", value: (evDelta > 0 ? "+" : "") + evDelta.toFixed(1) + "%" }] : []),
      ],
    });
  }

  // 6. QUALITY COMPOSITE
  if (qualityScore > 0) {
    const qSeverity = qualityScore >= 0.7 ? "positive" : qualityScore >= 0.4 ? "neutral" : "warning";
    blocks.push({
      id: "quality",
      title: "Quality Composite",
      severity: qSeverity,
      claim: qualityScore >= 0.7
        ? `Quality composite at ${Math.round(qualityScore * 100)}% indicates institutional-grade operational health.`
        : qualityScore >= 0.4
          ? `Quality composite at ${Math.round(qualityScore * 100)}%. Targeted improvements recommended.`
          : `Quality composite at ${Math.round(qualityScore * 100)}% is below threshold. Structural improvements needed.`,
      metrics: [
        { label: "Quality", value: Math.round(qualityScore * 100) + "%" },
      ],
    });
  }

  return blocks;
}

// ────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ────────────────────────────────────────────────────────────────────────────

export function generateCommentary(input: CommentaryInput): CommentaryOutput {
  const { simulationResult, verdict, assessmentPayload, summary, engineResult, baseEngineResult } = input;

  // Priority 1: Simulation data (in-memory or persisted)
  const hasSimData = !!(simulationResult || assessmentPayload);
  if (hasSimData) {
    return {
      source: "simulation",
      blocks: fromSimulation(simulationResult, verdict, assessmentPayload, summary),
    };
  }

  // Priority 2: Engine results (always available when baseline exists)
  if (engineResult) {
    return {
      source: "engine",
      blocks: fromEngine(engineResult, baseEngineResult),
    };
  }

  // Priority 3: Nothing
  return { source: "empty", blocks: [] };
}

