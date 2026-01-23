// src/logic/monteCarloEngine.ts
// STRATFIT — Monte Carlo Simulation Engine
// 10,000 futures. One verdict.

export type ScenarioId = "base" | "upside" | "downside" | "extreme";

// ============================================================================
// TYPES
// ============================================================================

export interface LeverState {
  demandStrength: number;
  pricingPower: number;
  expansionVelocity: number;
  costDiscipline: number;
  hiringIntensity: number;
  operatingDrag: number;
  marketVolatility: number;
  executionRisk: number;
  fundingPressure: number;
}

export interface SimulationResult {
  survived: boolean;
  endCash: number;
  endARR: number;
  endValuation: number;
  monthOfDeath?: number;
  failureTrigger?: 'revenue_miss' | 'burn_spike' | 'market_shock' | 'churn_spiral' | 'funding_gap';
}

export interface MonteCarloOutput {
  results: SimulationResult[];
  runTimeMs: number;
  inputSnapshot: {
    levers: LeverState;
    scenario: ScenarioId;
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const SIMULATION_COUNT = 10_000;
const HORIZON_MONTHS = 36;

// Default levers (matches App.tsx INITIAL_LEVERS)
export const DEFAULT_LEVERS: LeverState = {
  demandStrength: 60,
  pricingPower: 50,
  expansionVelocity: 45,
  costDiscipline: 55,
  hiringIntensity: 40,
  operatingDrag: 35,
  marketVolatility: 30,
  executionRisk: 25,
  fundingPressure: 20,
};

// ============================================================================
// RANDOM UTILITIES (Fast seeded random - Mulberry32)
// ============================================================================

function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function normalRandom(rand: () => number, mean: number, stdDev: number): number {
  const u1 = rand();
  const u2 = rand();
  const z = Math.sqrt(-2 * Math.log(u1 + 0.0001)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

// ============================================================================
// SINGLE SIMULATION PATH
// ============================================================================

function runSinglePath(
  levers: LeverState, 
  scenario: ScenarioId, 
  rand: () => number
): SimulationResult {
  // Normalize levers to 0-1
  const demand = levers.demandStrength / 100;
  const pricing = levers.pricingPower / 100;
  const expansion = levers.expansionVelocity / 100;
  const cost = levers.costDiscipline / 100;
  const hiring = levers.hiringIntensity / 100;
  const drag = levers.operatingDrag / 100;
  const volatility = levers.marketVolatility / 100;
  const execRisk = levers.executionRisk / 100;
  const fundingPressure = levers.fundingPressure / 100;

  // Scenario multiplier
  const scenarioMult = scenario === 'upside' ? 1.18 
    : scenario === 'downside' ? 0.82 
    : scenario === 'extreme' ? 0.65 
    : 1.0;

  // Initial state (in $M)
  let cash = (2.8 + pricing * 1.8 - drag * 1.0 + cost * 1.2) * scenarioMult;
  let mrr = (0.08 + demand * 0.12 + expansion * 0.08 + pricing * 0.06) * scenarioMult;

  // Monthly dynamics
  const baseGrowth = (0.04 + demand * 0.06 + expansion * 0.04) * scenarioMult;
  const baseChurn = 0.015 + volatility * 0.025 + execRisk * 0.015;
  const baseBurn = (0.12 + hiring * 0.12 + drag * 0.06 - cost * 0.04);

  let monthOfDeath: number | undefined;
  let failureTrigger: SimulationResult['failureTrigger'];

  // Track what might kill this path
  let revenueShortfalls = 0;
  let burnSpikes = 0;
  let hadMarketShock = false;

  // Run 36 months
  for (let month = 1; month <= HORIZON_MONTHS; month++) {
    // Apply variance
    const growthVar = normalRandom(rand, 1, 0.18 + volatility * 0.12);
    const churnVar = normalRandom(rand, 1, 0.12);
    const burnVar = normalRandom(rand, 1, 0.10);

    // Market shock (2.5% chance per month, worse in downside/extreme)
    const shockChance = scenario === 'extreme' ? 0.045 : scenario === 'downside' ? 0.035 : 0.025;
    const hasShock = rand() < shockChance;
    const shockMult = hasShock ? (0.70 + rand() * 0.15) : 1;
    
    if (hasShock) hadMarketShock = true;

    // Revenue growth
    const effectiveGrowth = baseGrowth * growthVar * shockMult;
    const effectiveChurn = baseChurn * churnVar;
    const netGrowth = effectiveGrowth - effectiveChurn;
    
    if (netGrowth < 0.01) revenueShortfalls++;
    
    mrr = Math.max(0.01, mrr * (1 + netGrowth));

    // Burn calculation
    const monthlyBurn = baseBurn * burnVar * (1 + hiring * 0.15);
    if (monthlyBurn > baseBurn * 1.3) burnSpikes++;

    // Cash flow
    cash += mrr - monthlyBurn;

    // Death check
    if (cash <= 0 && !monthOfDeath) {
      monthOfDeath = month;
      
      // Determine what triggered the failure
      if (hadMarketShock && month < 18) {
        failureTrigger = 'market_shock';
      } else if (burnSpikes > 3) {
        failureTrigger = 'burn_spike';
      } else if (revenueShortfalls > 4) {
        failureTrigger = 'revenue_miss';
      } else if (effectiveChurn > baseChurn * 1.5) {
        failureTrigger = 'churn_spiral';
      } else {
        failureTrigger = 'funding_gap';
      }

      // Emergency funding attempt (probability based on conditions)
      const fundingChance = 0.25 * (1 - fundingPressure) * (1 - execRisk * 0.5) * (mrr > 0.1 ? 1.2 : 0.8);
      if (rand() < fundingChance) {
        cash += 1.5 + rand() * 2.0; // Emergency bridge
        monthOfDeath = undefined;
        failureTrigger = undefined;
      }
    }
  }

  // Calculate end state
  const endARR = mrr * 12;
  const survived = cash > 0;
  
  // Valuation multiple based on health
  const healthScore = survived ? (demand * 0.3 + pricing * 0.25 + cost * 0.2 + (1 - volatility) * 0.15 + (1 - execRisk) * 0.1) : 0;
  const multiple = survived ? (3 + healthScore * 8) * scenarioMult : 0;
  const endValuation = survived ? endARR * multiple : 0;

  return {
    survived,
    endCash: Math.max(0, cash),
    endARR,
    endValuation,
    monthOfDeath,
    failureTrigger,
  };
}

// ============================================================================
// PUBLIC API
// ============================================================================

export function runMonteCarlo(
  levers: LeverState = DEFAULT_LEVERS, 
  scenario: ScenarioId = 'base'
): MonteCarloOutput {
  const start = performance.now();
  const seed = Date.now();
  
  const results: SimulationResult[] = new Array(SIMULATION_COUNT);
  
  for (let i = 0; i < SIMULATION_COUNT; i++) {
    const rand = mulberry32(seed + i);
    results[i] = runSinglePath(levers, scenario, rand);
  }

  return {
    results,
    runTimeMs: Math.round(performance.now() - start),
    inputSnapshot: { levers, scenario },
  };
}
