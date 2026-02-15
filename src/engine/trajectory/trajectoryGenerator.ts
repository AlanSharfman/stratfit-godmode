import type { TrajectoryVector } from "@/types/trajectory";

/**
 * Generates a trajectory path from business metrics.
 * This is the business logic → visual path conversion layer.
 *
 * The path is purely derived from state - no simulation logic here.
 *
 * @param metrics - Business metrics to convert into path shape
 * @returns Array of trajectory vectors (t, x, z) without y (terrain projection happens later)
 */
export function generateTrajectoryFromMetrics(metrics: {
  growthRate: number;
  riskLevel: number;
  volatility: number;
}): TrajectoryVector[] {
  const points: TrajectoryVector[] = [];
  const steps = 40;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;

    // X = progression along path (-10 to +10 range)
    const x = t * 20 - 10;

    // Z = business shape influenced by metrics
    // - Sin wave modulated by volatility
    // - Linear growth component
    // - Risk offset
    const z =
      Math.sin(t * Math.PI * (1 + metrics.volatility)) * 2 +
      metrics.growthRate * t * 3 -
      metrics.riskLevel * 1.5;

    points.push({ t, x, z });
  }

  return points;
}

/**
 * Generates a simple demo trajectory for testing.
 * Use this when no business metrics are available yet.
 */
export function generateDemoTrajectory(): TrajectoryVector[] {
  return generateTrajectoryFromMetrics({
    growthRate: 0.8,
    riskLevel: 0.3,
    volatility: 0.5,
  });
}
