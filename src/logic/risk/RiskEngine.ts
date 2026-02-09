// src/logic/risk/RiskEngine.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Institutional Monte Carlo–Derived Risk Engine
//
// ISOLATION RULES:
// • Consumes ONLY simulationStore.fullResult (MonteCarloResult)
// • Does NOT read from scenarioStore, static KPIs, or legacy panels.
// • Returns "Not Computed" sentinel when simulation results are missing.
// • No fallback mock data. No silent defaults.
// ═══════════════════════════════════════════════════════════════════════════

import type {
  MonteCarloResult,
  SingleSimulationResult,
  SensitivityFactor,
  DistributionStats,
} from "@/logic/monteCarloEngine";

// ============================================================================
// OUTPUT TYPES
// ============================================================================

export interface RiskDrivers {
  marketVolatilityImpact: number;
  burnRateImpact: number;
  churnImpact: number;
  growthVarianceImpact: number;
  capitalStructureImpact: number;
}

export interface RiskProfile {
  survivalProbability: number; // 0–1
  failureProbability: number; // 0–1
  valueAtRisk95: number; // 5th percentile of valuation
  tailRiskScore: number; // mean worst 5% vs median ratio
  volatilityIndex: number; // std / mean across revenue paths
  burnFragilityIndex: number; // P(runway < 6 months)
  riskDrivers: RiskDrivers;
  classification: "Robust" | "Stable" | "Fragile" | "Critical";
  iterationCount: number;
  computed: true;
}

export interface RiskNotComputed {
  computed: false;
  reason: string;
}

export type RiskResult = RiskProfile | RiskNotComputed;

// ============================================================================
// INPUT TYPE (strict — only what we consume)
// ============================================================================

export interface RiskEngineInput {
  /** Full Monte Carlo result from simulationStore. Null = not available. */
  monteCarloResult: MonteCarloResult | null;
  /** Optional: EV multiplier to convert ARR → enterprise value for VaR. Default: 3.5x */
  evMultiple?: number;
}

// ============================================================================
// CORE COMPUTATION
// ============================================================================

export function computeRiskProfile(input: RiskEngineInput): RiskResult {
  const { monteCarloResult, evMultiple = 3.5 } = input;

  // ── Guard: no simulation results ──
  if (!monteCarloResult) {
    if (typeof console !== "undefined") {
      console.warn("[RiskEngine] No simulation results available. Risk profile cannot be computed.");
    }
    return { computed: false, reason: "Simulation results not available. Run a Monte Carlo simulation first." };
  }

  const sims = monteCarloResult.allSimulations;
  if (!sims || sims.length === 0) {
    if (typeof console !== "undefined") {
      console.warn("[RiskEngine] allSimulations array is empty. Cannot compute risk.");
    }
    return { computed: false, reason: "No simulation paths found in results." };
  }

  // ── 1) Survival Probability ──
  // % of simulations where: survived AND ARR > collapse threshold
  const collapseThresholdARR = monteCarloResult.arrPercentiles.p10 * 0.1; // 10% of p10 = effectively dead
  const survivors = sims.filter(
    (s) => s.didSurvive && s.finalARR > collapseThresholdARR
  );
  const survivalProbability = survivors.length / sims.length;
  const failureProbability = 1 - survivalProbability;

  // ── 2) Value at Risk (VaR 95%) ──
  // 5th percentile of enterprise value distribution
  const evValues = sims.map((s) => s.finalARR * evMultiple).sort((a, b) => a - b);
  const p5Index = Math.max(0, Math.floor(sims.length * 0.05));
  const valueAtRisk95 = evValues[p5Index];

  // ── 3) Tail Risk Score ──
  // Mean of worst 5% outcomes divided by median — measures severity of left tail
  const worst5pct = evValues.slice(0, Math.max(1, Math.ceil(sims.length * 0.05)));
  const worst5Mean = worst5pct.reduce((a, b) => a + b, 0) / worst5pct.length;
  const median = evValues[Math.floor(sims.length * 0.5)];
  const tailRiskScore = median > 0 ? Math.max(0, 1 - worst5Mean / median) : 1;

  // ── 4) Volatility Index ──
  // Coefficient of variation across all revenue paths
  const arrDist = monteCarloResult.arrDistribution;
  const volatilityIndex =
    arrDist.mean > 0 ? arrDist.stdDev / arrDist.mean : 1;

  // ── 5) Burn Fragility Index ──
  // Probability that runway falls below 6 months within horizon
  const fragileCount = sims.filter((s) => s.finalRunway < 6).length;
  const burnFragilityIndex = fragileCount / sims.length;

  // ── 6) Risk Drivers ──
  const riskDrivers = computeRiskDrivers(monteCarloResult.sensitivityFactors);

  // ── Classification ──
  const classification = classifyRisk(
    survivalProbability,
    volatilityIndex,
    burnFragilityIndex,
    tailRiskScore
  );

  return {
    survivalProbability,
    failureProbability,
    valueAtRisk95,
    tailRiskScore,
    volatilityIndex,
    burnFragilityIndex,
    riskDrivers,
    classification,
    iterationCount: sims.length,
    computed: true,
  };
}

// ============================================================================
// RISK DRIVER ATTRIBUTION
// ============================================================================

/**
 * Maps sensitivity factors from Monte Carlo to risk driver categories.
 * Uses impact magnitude as contribution weight.
 */
function computeRiskDrivers(factors: SensitivityFactor[]): RiskDrivers {
  // Default zero
  const drivers: RiskDrivers = {
    marketVolatilityImpact: 0,
    burnRateImpact: 0,
    churnImpact: 0,
    growthVarianceImpact: 0,
    capitalStructureImpact: 0,
  };

  if (!factors || factors.length === 0) return drivers;

  // Map lever names to risk driver categories
  const categoryMap: Record<string, keyof RiskDrivers> = {
    marketVolatility: "marketVolatilityImpact",
    pricingPower: "marketVolatilityImpact",
    competitivePressure: "marketVolatilityImpact",
    costDiscipline: "burnRateImpact",
    operatingDrag: "burnRateImpact",
    hiringVelocity: "burnRateImpact",
    churnRate: "churnImpact",
    expansionVelocity: "churnImpact",
    retentionStrength: "churnImpact",
    demandStrength: "growthVarianceImpact",
    executionRisk: "growthVarianceImpact",
    productMarketFit: "growthVarianceImpact",
    fundraisingLikelihood: "capitalStructureImpact",
    debtExposure: "capitalStructureImpact",
    capitalEfficiency: "capitalStructureImpact",
  };

  // Accumulate absolute impact into categories
  const totals: Record<keyof RiskDrivers, number> = {
    marketVolatilityImpact: 0,
    burnRateImpact: 0,
    churnImpact: 0,
    growthVarianceImpact: 0,
    capitalStructureImpact: 0,
  };

  let totalImpact = 0;

  for (const f of factors) {
    const absImpact = Math.abs(f.impact);
    totalImpact += absImpact;
    const category = categoryMap[f.lever as string];
    if (category) {
      totals[category] += absImpact;
    } else {
      // Unrecognized levers split across growth and market
      totals.growthVarianceImpact += absImpact * 0.5;
      totals.marketVolatilityImpact += absImpact * 0.5;
    }
  }

  // Normalize to 0–1
  if (totalImpact > 0) {
    drivers.marketVolatilityImpact = totals.marketVolatilityImpact / totalImpact;
    drivers.burnRateImpact = totals.burnRateImpact / totalImpact;
    drivers.churnImpact = totals.churnImpact / totalImpact;
    drivers.growthVarianceImpact = totals.growthVarianceImpact / totalImpact;
    drivers.capitalStructureImpact = totals.capitalStructureImpact / totalImpact;
  }

  return drivers;
}

// ============================================================================
// CLASSIFICATION
// ============================================================================

function classifyRisk(
  survival: number,
  volatility: number,
  burnFragility: number,
  tailRisk: number
): "Robust" | "Stable" | "Fragile" | "Critical" {
  // Composite score: weighted blend
  const score =
    survival * 0.35 +
    (1 - Math.min(1, volatility)) * 0.20 +
    (1 - burnFragility) * 0.25 +
    (1 - tailRisk) * 0.20;

  if (score >= 0.75) return "Robust";
  if (score >= 0.55) return "Stable";
  if (score >= 0.35) return "Fragile";
  return "Critical";
}

// ============================================================================
// HELPERS — For UI formatting
// ============================================================================

export function getRiskColor(classification: RiskProfile["classification"]): string {
  switch (classification) {
    case "Robust": return "#34d399";
    case "Stable": return "#00E0FF";
    case "Fragile": return "#fbbf24";
    case "Critical": return "#ef4444";
  }
}

export function formatPercent(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

export function formatCurrency(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

