// src/logic/simulateReducer.ts
// STRATFIT — Reduce 10,000 Futures to Verdict
// Tiers, kill-switches, causality chains

import type { SimulationResult, MonteCarloOutput, LeverState } from './monteCarloEngine';

// ============================================================================
// VERDICT TYPES
// ============================================================================

export type SurvivalTier = 'HIGH_RISK' | 'MODERATE' | 'VIABLE' | 'STRONG';

export interface OutcomeBuckets {
  crash: number;      // Died before month 18
  survive: number;    // Alive but struggling (low cash/valuation)
  grow: number;       // Healthy growth
  breakout: number;   // Top performers
}

export interface ValuationRange {
  p10: number;
  p50: number;
  p90: number;
}

export interface KillSwitch {
  metric: string;
  currentValue: string;
  threshold: string;
  impact: string;
  recommendation: string;
  isViolated: boolean;
}

export interface CausalityChain {
  percentage: number;
  chain: string[];
  summary: string;
}

export interface SimulateVerdict {
  // Core metrics
  survivalPct: number;
  tier: SurvivalTier;
  tierLabel: string;
  
  // Distribution
  outcomeBuckets: OutcomeBuckets;
  valuationRange: ValuationRange;
  
  // Insights
  killSwitch: KillSwitch;
  causality: CausalityChain;
  
  // Meta
  simulationCount: number;
  runTimeMs: number;
  
  // Edge case flags
  isOverlyOptimistic: boolean;
  isHighUncertainty: boolean;
  isKillSwitchViolated: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (hi >= sorted.length) return sorted[sorted.length - 1];
  const weight = idx - lo;
  return sorted[lo] * (1 - weight) + sorted[hi] * weight;
}

function getSurvivalTier(pct: number): { tier: SurvivalTier; label: string } {
  if (pct >= 85) return { tier: 'STRONG', label: 'Strong' };
  if (pct >= 65) return { tier: 'VIABLE', label: 'Viable' };
  if (pct >= 40) return { tier: 'MODERATE', label: 'Moderate Risk' };
  return { tier: 'HIGH_RISK', label: 'High Risk' };
}

function formatMoney(val: number): string {
  if (val >= 1) return `$${val.toFixed(1)}M`;
  return `$${Math.round(val * 1000)}K`;
}

// ============================================================================
// KILL-SWITCH DETECTION
// ============================================================================

function detectKillSwitch(
  results: SimulationResult[], 
  levers: LeverState
): KillSwitch {
  // Analyze what kills the failures
  const failures = results.filter(r => !r.survived);
  const survivors = results.filter(r => r.survived);
  
  if (failures.length === 0) {
    return {
      metric: 'Burn Rate',
      currentValue: `$${Math.round(120 + levers.hiringIntensity * 1.5)}K/mo`,
      threshold: `$${Math.round(180 + levers.hiringIntensity * 0.8)}K/mo`,
      impact: 'Survival would drop significantly',
      recommendation: `Keep burn below $${Math.round(165 + levers.hiringIntensity * 0.5)}K to maintain buffer`,
      isViolated: false,
    };
  }

  // Calculate effective burn from levers
  const effectiveBurn = 120 + levers.hiringIntensity * 1.2 + levers.operatingDrag * 0.8 - levers.costDiscipline * 0.4;
  const burnThreshold = 165 + levers.costDiscipline * 0.3;
  const isBurnViolated = effectiveBurn > burnThreshold;

  // Check revenue sensitivity
  const revenueSensitivity = levers.demandStrength < 50 || levers.pricingPower < 45;
  
  // Check hiring risk
  const hiringRisk = levers.hiringIntensity > 60 && levers.costDiscipline < 50;

  // Determine primary kill-switch
  if (isBurnViolated || hiringRisk) {
    const survivalDrop = Math.round(35 + (effectiveBurn - burnThreshold) * 0.5);
    return {
      metric: 'Burn Rate',
      currentValue: `$${Math.round(effectiveBurn)}K/mo`,
      threshold: `$${Math.round(burnThreshold)}K/mo`,
      impact: `Survival drops ${Math.min(survivalDrop, 50)}%`,
      recommendation: `Keep burn below $${Math.round(burnThreshold - 15)}K to stay in viable zone`,
      isViolated: isBurnViolated,
    };
  }

  if (revenueSensitivity) {
    const demandImpact = Math.round(25 + (50 - levers.demandStrength) * 0.6);
    return {
      metric: 'Revenue Growth',
      currentValue: `${levers.demandStrength}% demand`,
      threshold: '50% demand minimum',
      impact: `Survival drops ${Math.min(demandImpact, 45)}%`,
      recommendation: 'Increase demand strength above 55% or reduce expansion velocity',
      isViolated: levers.demandStrength < 45,
    };
  }

  // Default: funding pressure
  return {
    metric: 'Runway Buffer',
    currentValue: `${Math.round(18 - levers.fundingPressure * 0.12)} months`,
    threshold: '12 months minimum',
    impact: 'Survival drops 35%',
    recommendation: 'Maintain 15+ months runway before aggressive expansion',
    isViolated: levers.fundingPressure > 50,
  };
}

// ============================================================================
// CAUSALITY CHAIN GENERATION
// ============================================================================

function generateCausality(results: SimulationResult[]): CausalityChain {
  const failures = results.filter(r => !r.survived);
  
  if (failures.length === 0) {
    return {
      percentage: 0,
      chain: [],
      summary: 'No failure paths detected in this scenario.',
    };
  }

  // Count failure triggers
  const triggerCounts: Record<string, number> = {
    revenue_miss: 0,
    burn_spike: 0,
    market_shock: 0,
    churn_spiral: 0,
    funding_gap: 0,
  };

  failures.forEach(f => {
    if (f.failureTrigger) {
      triggerCounts[f.failureTrigger]++;
    }
  });

  // Find dominant trigger
  const sorted = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1]);
  const [topTrigger, topCount] = sorted[0];
  const percentage = Math.round((topCount / failures.length) * 100);

  // Build causal chain based on trigger
  const chains: Record<string, { chain: string[]; summary: string }> = {
    revenue_miss: {
      chain: ['Revenue miss', 'Hiring freeze', 'Product delays', 'Churn spike', 'Cash crisis'],
      summary: `In ${percentage}% of failures: revenue miss → hiring freeze → delayed product → churn spike → death`,
    },
    burn_spike: {
      chain: ['Burn spike', 'Runway compression', 'Emergency cuts', 'Team exodus', 'Death spiral'],
      summary: `In ${percentage}% of failures: burn exceeded projections → runway collapsed → forced layoffs → death`,
    },
    market_shock: {
      chain: ['Market shock', 'Revenue drop', 'Investor pullback', 'Bridge failure', 'Shutdown'],
      summary: `In ${percentage}% of failures: market shock → revenue cratered → couldn't raise → death`,
    },
    churn_spiral: {
      chain: ['Churn spike', 'NRR collapse', 'Growth stall', 'Burn > revenue', 'Cash out'],
      summary: `In ${percentage}% of failures: churn spiked → net revenue retention collapsed → couldn't outrun burn`,
    },
    funding_gap: {
      chain: ['Funding gap', 'Runway crunch', 'Desperate terms', 'Down round', 'Zombie mode'],
      summary: `In ${percentage}% of failures: couldn't close funding → runway ran out → death`,
    },
  };

  const result = chains[topTrigger] || chains.revenue_miss;
  
  return {
    percentage,
    chain: result.chain,
    summary: result.summary,
  };
}

// ============================================================================
// MAIN REDUCER
// ============================================================================

export function reduceToVerdict(output: MonteCarloOutput): SimulateVerdict {
  const { results, runTimeMs, inputSnapshot } = output;
  const count = results.length;

  // === SURVIVAL % ===
  const survived = results.filter(r => r.survived).length;
  const survivalPct = Math.round((survived / count) * 100);
  const { tier, label: tierLabel } = getSurvivalTier(survivalPct);

  // === VALUATION RANGE ===
  const valuations = results
    .filter(r => r.survived && r.endValuation > 0)
    .map(r => r.endValuation)
    .sort((a, b) => a - b);

  const valuationRange: ValuationRange = {
    p10: Math.round(percentile(valuations, 10) * 10) / 10,
    p50: Math.round(percentile(valuations, 50) * 10) / 10,
    p90: Math.round(percentile(valuations, 90) * 10) / 10,
  };

  // === OUTCOME BUCKETS ===
  const breakoutThreshold = valuations.length > 0 ? percentile(valuations, 85) : Infinity;
  const struggleThreshold = valuations.length > 0 ? percentile(valuations, 25) : 0;

  let crash = 0, survive = 0, grow = 0, breakout = 0;

  for (const r of results) {
    if (!r.survived || (r.monthOfDeath && r.monthOfDeath <= 18)) {
      crash++;
    } else if (r.endValuation >= breakoutThreshold) {
      breakout++;
    } else if (r.endValuation <= struggleThreshold || r.endCash < 0.5) {
      survive++;
    } else {
      grow++;
    }
  }

  const outcomeBuckets: OutcomeBuckets = {
    crash: Math.round((crash / count) * 100),
    survive: Math.round((survive / count) * 100),
    grow: Math.round((grow / count) * 100),
    breakout: Math.round((breakout / count) * 100),
  };

  // Fix rounding to sum to 100%
  const sum = outcomeBuckets.crash + outcomeBuckets.survive + outcomeBuckets.grow + outcomeBuckets.breakout;
  if (sum !== 100) {
    outcomeBuckets.grow += (100 - sum);
  }

  // === KILL-SWITCH ===
  const killSwitch = detectKillSwitch(results, inputSnapshot.levers);

  // === CAUSALITY ===
  const causality = generateCausality(results);

  // === EDGE CASE FLAGS ===
  const isOverlyOptimistic = survivalPct >= 95;
  const isHighUncertainty = 
    Math.abs(outcomeBuckets.crash - 25) < 8 &&
    Math.abs(outcomeBuckets.survive - 25) < 8 &&
    Math.abs(outcomeBuckets.grow - 25) < 8 &&
    Math.abs(outcomeBuckets.breakout - 25) < 8;
  const isKillSwitchViolated = killSwitch.isViolated;

  return {
    survivalPct,
    tier,
    tierLabel,
    outcomeBuckets,
    valuationRange,
    killSwitch,
    causality,
    simulationCount: count,
    runTimeMs,
    isOverlyOptimistic,
    isHighUncertainty,
    isKillSwitchViolated,
  };
}
