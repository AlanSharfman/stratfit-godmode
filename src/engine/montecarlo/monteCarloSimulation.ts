import type { MonteCarloResult, MonteCarloConfig } from "@/types/simulation";

/**
 * Run Monte Carlo simulation on business metrics.
 *
 * This is a simplified simulation that models outcome distributions
 * based on input parameters. In production, this would integrate
 * with the actual financial model.
 */
export function runMonteCarloSimulation(
  config: MonteCarloConfig,
  inputs: {
    baseRevenue: number;
    baseCost: number;
    growthRate: number;
    volatility: number;
  }
): MonteCarloResult {
  const { simulationRuns, volatilityFactor } = config;
  const { baseRevenue, baseCost, growthRate, volatility } = inputs;

  const outcomes: number[] = [];

  // Run simulations
  for (let i = 0; i < simulationRuns; i++) {
    // Random walk with drift
    let value = baseRevenue - baseCost;

    // Apply growth with random variation
    const randomGrowth = growthRate + (Math.random() - 0.5) * volatility * volatilityFactor;
    value *= 1 + randomGrowth;

    // Add noise
    value += (Math.random() - 0.5) * value * volatilityFactor;

    outcomes.push(value);
  }

  // Sort for percentile calculation
  outcomes.sort((a, b) => a - b);

  // Calculate statistics
  const successThreshold = 0; // Break-even
  const successes = outcomes.filter((v) => v > successThreshold).length;
  const failures = outcomes.filter((v) => v < -Math.abs(baseCost) * 0.5).length;

  const mean = outcomes.reduce((a, b) => a + b, 0) / outcomes.length;
  const variance =
    outcomes.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / outcomes.length;

  return {
    successRate: successes / simulationRuns,
    failureRate: failures / simulationRuns,
    expectedValue: mean,
    variance,
    percentiles: {
      p5: outcomes[Math.floor(simulationRuns * 0.05)],
      p25: outcomes[Math.floor(simulationRuns * 0.25)],
      p50: outcomes[Math.floor(simulationRuns * 0.5)],
      p75: outcomes[Math.floor(simulationRuns * 0.75)],
      p95: outcomes[Math.floor(simulationRuns * 0.95)],
    },
  };
}

/**
 * Generate particle positions from simulation results.
 */
export function generateParticleDistribution(
  result: MonteCarloResult,
  count: number,
  bounds: { xRange: [number, number]; yRange: [number, number]; zRange: [number, number] }
): Array<{
  position: [number, number, number];
  outcome: "success" | "neutral" | "failure";
  probability: number;
}> {
  const particles: Array<{
    position: [number, number, number];
    outcome: "success" | "neutral" | "failure";
    probability: number;
  }> = [];

  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    let outcome: "success" | "neutral" | "failure";

    if (rand < result.successRate) {
      outcome = "success";
    } else if (rand < result.successRate + (1 - result.successRate - result.failureRate)) {
      outcome = "neutral";
    } else {
      outcome = "failure";
    }

    // Position based on outcome
    const xBase = outcome === "success" ? 0.3 : outcome === "failure" ? -0.3 : 0;
    const x =
      bounds.xRange[0] +
      (bounds.xRange[1] - bounds.xRange[0]) * (0.5 + xBase + (Math.random() - 0.5) * 0.4);
    const y = bounds.yRange[0] + (bounds.yRange[1] - bounds.yRange[0]) * Math.random();
    const z = bounds.zRange[0] + (bounds.zRange[1] - bounds.zRange[0]) * Math.random();

    particles.push({
      position: [x, y, z],
      outcome,
      probability: outcome === "success" ? result.successRate : outcome === "failure" ? result.failureRate : 1 - result.successRate - result.failureRate,
    });
  }

  return particles;
}
