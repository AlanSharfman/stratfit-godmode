import type { PathGeometry, PathSpec } from "./PathContract";

/**
 * Input structure for buildPathGeometry.
 * Contains all data sources needed to generate path geometry.
 */
export type PathBuilderInputs = {
  /** Returns terrain height (y) at given world x,z coordinates */
  terrainSampler: (x: number, z: number) => number;

  /** XZ trajectory points (generated elsewhere, e.g. from simulation) */
  trajectoryXZ: Array<{ x: number; z: number }>;

  /** Per-point metric series (must match trajectoryXZ length) */
  metrics: {
    riskIndexSeries: number[];
    varianceSeries: number[];
    confidenceSeries: number[];
  };
};

/**
 * Normalizes an array to 0..1 range.
 * Safe for edge cases (empty array, constant values).
 */
function norm01(arr: number[]): number[] {
  if (arr.length === 0) return [];
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const d = Math.max(1e-9, max - min);
  return arr.map((v) => (v - min) / d);
}

/**
 * Single canonical builder for path geometry.
 *
 * RULES (NON-NEGOTIABLE):
 * - Any path shown in the UI MUST come from here
 * - No direct path construction in UI components
 * - All analytics must flow through this builder
 *
 * @param spec - Path specification with metric bindings
 * @param inputs - Data sources (terrain, trajectory, metrics)
 * @returns PathGeometry ready for rendering
 */
export function buildPathGeometry(
  spec: PathSpec,
  inputs: PathBuilderInputs
): PathGeometry {
  const { trajectoryXZ, terrainSampler, metrics } = inputs;

  // Project XZ points to terrain surface
  const points = trajectoryXZ.map((p) => ({
    x: p.x,
    z: p.z,
    y: terrainSampler(p.x, p.z),
  }));

  // Normalize metric series to 0..1 for rendering
  const risk = norm01(metrics.riskIndexSeries);
  const envelope = norm01(metrics.varianceSeries);
  const confidence = norm01(metrics.confidenceSeries);

  return {
    points,
    risk,
    envelope,
    confidence,
    proof: {
      timeAxis: spec.timeAxis,
      timeStart: spec.timeStart,
      timeEnd: spec.timeEnd,
      interventionHash: spec.interventionHash,
    },
  };
}
