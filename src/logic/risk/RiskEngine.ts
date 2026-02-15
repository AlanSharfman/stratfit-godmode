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
  SensitivityFactor,
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
  survivalProbability: number;
  failureProbability: number;
  valueAtRisk95: number;
  tailRiskScore: number;
  volatilityIndex: number;
  burnFragilityIndex: number;
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
// INPUT TYPE
// ============================================================================

export interface RiskEngineInput {
  monteCarloResult: MonteCarloResult | null;
  evMultiple?: number;
}

// ============================================================================
// CORE COMPUTATION
// ============================================================================

export function computeRiskProfile(input: RiskEngineInput): RiskResult {
  const { monteCarloResult, evMultiple = 3.5 } = input;

  if (!monteCarloResult) {
    if (typeof console !== "undefined") {
      console.warn("[RiskEngine] No simulation results. Risk profile cannot be computed.");
    }
    return { computed: false, reason: "Simulation results not available. Run a Monte Carlo simulation first." };
  }

  const sims = monteCarloResult.allSimulations;
  if (!sims || sims.length === 0) {
    if (typeof console !== "undefined") {
      console.warn("[RiskEngine] allSimulations is empty.");
    }
    return { computed: false, reason: "No simulation paths found in results." };
  }

  // 1) Survival Probability
  const collapseThreshold = monteCarloResult.arrPercentiles.p10 * 0.1;
  const survivors = sims.filter(s => s.didSurvive && s.finalARR > collapseThreshold);
  const survivalProbability = survivors.length / sims.length;
  const failureProbability = 1 - survivalProbability;

  // 2) Value at Risk (VaR 95%) — 5th percentile of EV
  const evValues = sims.map(s => s.finalARR * evMultiple).sort((a, b) => a - b);
  const p5Idx = Math.max(0, Math.floor(sims.length * 0.05));
  const valueAtRisk95 = evValues[p5Idx];

  // 3) Tail Risk — mean worst 5% / median
  const worst5 = evValues.slice(0, Math.max(1, Math.ceil(sims.length * 0.05)));
  const worst5Mean = worst5.reduce((a, b) => a + b, 0) / worst5.length;
  const median = evValues[Math.floor(sims.length * 0.5)];
  const tailRiskScore = median > 0 ? Math.max(0, 1 - worst5Mean / median) : 1;

  // 4) Volatility Index — CV across revenue paths
  const arrDist = monteCarloResult.arrDistribution;
  const volatilityIndex = arrDist.mean > 0 ? arrDist.stdDev / arrDist.mean : 1;

  // 5) Burn Fragility — P(runway < 6 months)
  const fragileCount = sims.filter(s => s.finalRunway < 6).length;
  const burnFragilityIndex = fragileCount / sims.length;

  // 6) Risk Drivers
  const riskDrivers = computeRiskDrivers(monteCarloResult.sensitivityFactors);

  // Classification
  const classification = classifyRisk(survivalProbability, volatilityIndex, burnFragilityIndex, tailRiskScore);

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

function computeRiskDrivers(factors: SensitivityFactor[]): RiskDrivers {
  const drivers: RiskDrivers = {
    marketVolatilityImpact: 0,
    burnRateImpact: 0,
    churnImpact: 0,
    growthVarianceImpact: 0,
    capitalStructureImpact: 0,
  };
  if (!factors || factors.length === 0) return drivers;

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

  const totals: Record<keyof RiskDrivers, number> = {
    marketVolatilityImpact: 0, burnRateImpact: 0, churnImpact: 0,
    growthVarianceImpact: 0, capitalStructureImpact: 0,
  };
  let totalImpact = 0;

  for (const f of factors) {
    const abs = Math.abs(f.impact);
    totalImpact += abs;
    const cat = categoryMap[f.lever as string];
    if (cat) { totals[cat] += abs; }
    else { totals.growthVarianceImpact += abs * 0.5; totals.marketVolatilityImpact += abs * 0.5; }
  }

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
  survival: number, volatility: number, burnFragility: number, tailRisk: number
): "Robust" | "Stable" | "Fragile" | "Critical" {
  const score = survival * 0.35 + (1 - Math.min(1, volatility)) * 0.20 +
    (1 - burnFragility) * 0.25 + (1 - tailRisk) * 0.20;
  if (score >= 0.75) return "Robust";
  if (score >= 0.55) return "Stable";
  if (score >= 0.35) return "Fragile";
  return "Critical";
}

// ============================================================================
// HELPERS
// ============================================================================

export function getRiskColor(c: RiskProfile["classification"]): string {
  switch (c) { case "Robust": return "#34d399"; case "Stable": return "#00E0FF"; case "Fragile": return "#fbbf24"; case "Critical": return "#ef4444"; }
}

export function fmtPct(v: number): string { return `${(v * 100).toFixed(1)}%`; }

export function fmtCurrency(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}
