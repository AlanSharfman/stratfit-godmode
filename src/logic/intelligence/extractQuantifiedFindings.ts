// src/logic/intelligence/extractQuantifiedFindings.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Quantified Findings Extractor
//
// INPUT:  SystemAnalysisSnapshot (the SOLE data source)
// OUTPUT: Array of QuantifiedFinding objects with category, narrative, citations
//
// RULES:
//   • No store imports. Pure function.
//   • No hardcoded narrative strings — every sentence is template-driven from
//     snapshot values. Citations reference exact numeric values.
//   • No "AI" labeling. This is deterministic extraction.
// ═══════════════════════════════════════════════════════════════════════════

import type { SystemAnalysisSnapshot } from "@/logic/system/SystemAnalysisEngine";

// ============================================================================
// TYPES
// ============================================================================

export interface Citation {
  label: string;
  value: string;
}

export interface QuantifiedFinding {
  id: string;
  category: "survival" | "revenue" | "capital" | "runway" | "sensitivity" | "risk" | "valuation" | "confidence";
  severity: "positive" | "neutral" | "warning" | "critical";
  narrative: string;
  citations: Citation[];
}

// ============================================================================
// FORMATTERS
// ============================================================================

function fmtPct(v: number, decimals = 0): string {
  return (v * 100).toFixed(decimals) + "%";
}

function fmtUsd(v: number): string {
  if (Math.abs(v) >= 1_000_000_000) return "$" + (v / 1_000_000_000).toFixed(1) + "B";
  if (Math.abs(v) >= 1_000_000) return "$" + (v / 1_000_000).toFixed(1) + "M";
  if (Math.abs(v) >= 1_000) return "$" + (v / 1_000).toFixed(0) + "K";
  return "$" + Math.round(v).toLocaleString();
}

function fmtMo(v: number): string {
  return Math.round(v) + "mo";
}

// ============================================================================
// EXTRACTION
// ============================================================================

export function extractQuantifiedFindings(snapshot: SystemAnalysisSnapshot): QuantifiedFinding[] {
  const findings: QuantifiedFinding[] = [];
  const { simulationSummary: sim, riskProfile: risk, sensitivityMap, tornadoRanking, valuationSummary, confidenceScore } = snapshot;

  // ── 1. SURVIVAL POSTURE ──
  const survRate = sim.survivalRate;
  const survSev = survRate >= 0.8 ? "positive" : survRate >= 0.5 ? "neutral" : survRate >= 0.3 ? "warning" : "critical";
  findings.push({
    id: "survival",
    category: "survival",
    severity: survSev,
    narrative: survRate >= 0.8
      ? `Structural survival probability is strong at ${fmtPct(survRate)}. The business sustains across ${fmtPct(survRate)} of ${sim.iterations.toLocaleString()} simulated paths over a ${sim.timeHorizonMonths}-month horizon.`
      : survRate >= 0.5
        ? `Survival probability is moderate at ${fmtPct(survRate)}. Approximately ${fmtPct(1 - survRate)} of simulated paths reach failure within ${sim.timeHorizonMonths} months.`
        : `Survival probability is critically low at ${fmtPct(survRate)}. ${fmtPct(1 - survRate)} of simulated futures result in business failure. Immediate intervention required.`,
    citations: [
      { label: "Survival", value: fmtPct(survRate) },
      { label: "Iterations", value: sim.iterations.toLocaleString() },
      { label: "Horizon", value: sim.timeHorizonMonths + "mo" },
    ],
  });

  // ── 2. REVENUE DISTRIBUTION ──
  const arrSpread = sim.arrPercentiles.p50 > 0
    ? (sim.arrPercentiles.p90 - sim.arrPercentiles.p10) / sim.arrPercentiles.p50
    : 0;
  const arrSev = arrSpread < 0.5 ? "positive" : arrSpread < 1.0 ? "neutral" : "warning";
  findings.push({
    id: "revenue",
    category: "revenue",
    severity: arrSev,
    narrative: arrSpread < 0.5
      ? `Revenue outcomes are tightly distributed around ${fmtUsd(sim.arrPercentiles.p50)} median ARR. Low dispersion (spread ${(arrSpread * 100).toFixed(0)}%) indicates a predictable growth trajectory.`
      : arrSpread < 1.0
        ? `Revenue range spans ${fmtUsd(sim.arrPercentiles.p10)} (P10) to ${fmtUsd(sim.arrPercentiles.p90)} (P90) with a median of ${fmtUsd(sim.arrPercentiles.p50)}. Moderate uncertainty in growth path (spread ${(arrSpread * 100).toFixed(0)}%).`
        : `Wide revenue dispersion detected: P10 at ${fmtUsd(sim.arrPercentiles.p10)} vs P90 at ${fmtUsd(sim.arrPercentiles.p90)}. Spread at ${(arrSpread * 100).toFixed(0)}% indicates high sensitivity to execution and market factors.`,
    citations: [
      { label: "ARR P10", value: fmtUsd(sim.arrPercentiles.p10) },
      { label: "ARR P50", value: fmtUsd(sim.arrPercentiles.p50) },
      { label: "ARR P90", value: fmtUsd(sim.arrPercentiles.p90) },
    ],
  });

  // ── 3. CAPITAL POSITION ──
  const cashSev = sim.cashPercentiles.p10 > 0
    ? (sim.cashPercentiles.p50 > 500_000 ? "positive" : "neutral")
    : "critical";
  findings.push({
    id: "capital",
    category: "capital",
    severity: cashSev,
    narrative: sim.cashPercentiles.p10 > 0
      ? `Median terminal cash is ${fmtUsd(sim.cashPercentiles.p50)}. Even under stress (P10), the business retains ${fmtUsd(sim.cashPercentiles.p10)} in reserves.`
      : `Stress scenarios (P10) show negative cash position at ${fmtUsd(sim.cashPercentiles.p10)}. Capital injection or burn reduction likely required before ${fmtMo(sim.runwayPercentiles.p10)}.`,
    citations: [
      { label: "Cash P10", value: fmtUsd(sim.cashPercentiles.p10) },
      { label: "Cash P50", value: fmtUsd(sim.cashPercentiles.p50) },
      { label: "Cash P90", value: fmtUsd(sim.cashPercentiles.p90) },
    ],
  });

  // ── 4. RUNWAY HORIZON ──
  const rp50 = sim.runwayPercentiles.p50;
  const rp10 = sim.runwayPercentiles.p10;
  const rSev = rp50 >= 24 ? "positive" : rp50 >= 12 ? "neutral" : rp50 >= 6 ? "warning" : "critical";
  findings.push({
    id: "runway",
    category: "runway",
    severity: rSev,
    narrative: rp50 >= 24
      ? `Median runway of ${fmtMo(rp50)} provides strategic flexibility. Stress runway (P10) at ${fmtMo(rp10)} remains above critical threshold.`
      : rp50 >= 12
        ? `Runway at ${fmtMo(rp50)} is adequate. Stress runway at ${fmtMo(rp10)} — plan next funding round or path to profitability within 6 months.`
        : `Runway compression: median ${fmtMo(rp50)}, stress case ${fmtMo(rp10)}. Immediate capital action or burn reduction required.`,
    citations: [
      { label: "Runway P10", value: fmtMo(rp10) },
      { label: "Runway P50", value: fmtMo(rp50) },
      { label: "Runway P90", value: fmtMo(sim.runwayPercentiles.p90) },
    ],
  });

  // ── 5. RISK CLASSIFICATION ──
  const riskSev = risk.classification === "Robust" ? "positive"
    : risk.classification === "Stable" ? "neutral"
    : risk.classification === "Fragile" ? "warning"
    : "critical";
  findings.push({
    id: "risk-class",
    category: "risk",
    severity: riskSev,
    narrative: `Risk classification: ${risk.classification}. VaR (95%) at ${fmtUsd(risk.valueAtRisk95)}, tail risk score ${(risk.tailRiskScore * 100).toFixed(1)}, burn fragility at ${fmtPct(risk.burnFragilityIndex)}. Volatility index ${risk.volatilityIndex.toFixed(3)}.`,
    citations: [
      { label: "Classification", value: risk.classification },
      { label: "VaR 95%", value: fmtUsd(risk.valueAtRisk95) },
      { label: "Tail Risk", value: (risk.tailRiskScore * 100).toFixed(1) },
      { label: "Burn Fragility", value: fmtPct(risk.burnFragilityIndex) },
      { label: "Volatility", value: risk.volatilityIndex.toFixed(3) },
    ],
  });

  // ── 6. SENSITIVITY DRIVERS ──
  if (sensitivityMap.length > 0) {
    const top3 = sensitivityMap.slice(0, 3);
    const topLabel = top3[0].label;
    const topScore = top3[0].elasticityScore;
    findings.push({
      id: "sensitivity",
      category: "sensitivity",
      severity: topScore > 0.6 ? "warning" : "neutral",
      narrative: `"${topLabel}" is the dominant sensitivity driver (elasticity ${(topScore * 100).toFixed(0)}%, ΔS ${top3[0].deltaSurvival >= 0 ? "+" : ""}${fmtPct(top3[0].deltaSurvival, 1)}).${top3.length > 1 ? ` Followed by "${top3[1].label}" (${(top3[1].elasticityScore * 100).toFixed(0)}%)` : ""}${top3.length > 2 ? ` and "${top3[2].label}" (${(top3[2].elasticityScore * 100).toFixed(0)}%).` : "."}`,
      citations: top3.map((d) => ({
        label: d.label,
        value: `${(d.elasticityScore * 100).toFixed(0)}% | ΔS ${d.deltaSurvival >= 0 ? "+" : ""}${fmtPct(d.deltaSurvival, 1)}`,
      })),
    });
  }

  // ── 7. RISK DRIVER CONTRIBUTIONS ──
  const driverEntries = Object.entries(risk.riskDrivers) as [string, number][];
  const topDrivers = [...driverEntries].sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (topDrivers.length > 0 && topDrivers[0][1] > 0) {
    const driverLabels: Record<string, string> = {
      marketVolatilityImpact: "Market Volatility",
      burnRateImpact: "Burn Rate Exposure",
      churnImpact: "Churn / Retention",
      growthVarianceImpact: "Growth Variance",
      capitalStructureImpact: "Capital Structure",
    };
    findings.push({
      id: "risk-drivers",
      category: "risk",
      severity: topDrivers[0][1] > 0.35 ? "warning" : "neutral",
      narrative: `Top risk contributors: ${topDrivers.map(([k, v]) => `${driverLabels[k] ?? k} (${(v * 100).toFixed(1)}%)`).join(", ")}.`,
      citations: topDrivers.map(([k, v]) => ({
        label: driverLabels[k] ?? k,
        value: (v * 100).toFixed(1) + "%",
      })),
    });
  }

  // ── 8. VALUATION (if available) ──
  if (valuationSummary) {
    const vSev = valuationSummary.p50 > 0 ? "neutral" : "warning";
    findings.push({
      id: "valuation",
      category: "valuation",
      severity: vSev,
      narrative: `Median enterprise value (P50): ${fmtUsd(valuationSummary.p50)}. Operating range (P25–P75): ${fmtUsd(valuationSummary.p25)} – ${fmtUsd(valuationSummary.p75)}. Stress range (P10–P90): ${fmtUsd(valuationSummary.p10)} – ${fmtUsd(valuationSummary.p90)}.`,
      citations: [
        { label: "EV P10", value: fmtUsd(valuationSummary.p10) },
        { label: "EV P25", value: fmtUsd(valuationSummary.p25) },
        { label: "EV P50", value: fmtUsd(valuationSummary.p50) },
        { label: "EV P75", value: fmtUsd(valuationSummary.p75) },
        { label: "EV P90", value: fmtUsd(valuationSummary.p90) },
      ],
    });
  }

  // ── 9. MODEL CONFIDENCE ──
  const confSev = confidenceScore.classification === "High" ? "positive"
    : confidenceScore.classification === "Moderate" ? "neutral"
    : "warning";
  findings.push({
    id: "confidence",
    category: "confidence",
    severity: confSev,
    narrative: `Model confidence: ${confidenceScore.confidenceScore.toFixed(0)}/100 (${confidenceScore.classification}). Sample adequacy: ${confidenceScore.drivers.sampleAdequacy.toFixed(0)}, dispersion risk: ${confidenceScore.drivers.dispersionRisk.toFixed(0)}, input integrity: ${confidenceScore.drivers.inputIntegrity.toFixed(0)}, cross-method alignment: ${confidenceScore.drivers.crossMethodAlignment.toFixed(0)}.`,
    citations: [
      { label: "Score", value: confidenceScore.confidenceScore.toFixed(0) + "/100" },
      { label: "Classification", value: confidenceScore.classification },
      { label: "Sample", value: confidenceScore.drivers.sampleAdequacy.toFixed(0) },
      { label: "Dispersion", value: confidenceScore.drivers.dispersionRisk.toFixed(0) },
    ],
  });

  return findings;
}


