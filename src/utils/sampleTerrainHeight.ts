// src/utils/sampleTerrainHeight.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Height Sampling Utility
//
// Thin wrapper around buildTerrain.sampleTerrainHeight for use by markers,
// overlays, and any code that needs terrain Y at world (x, z).
//
// Inside Canvas (R3F): prefer terrainRef.getHeightAt(x, z) instead.
// This util is for code that doesn't have access to the terrain ref.
// ═══════════════════════════════════════════════════════════════════════════

import { sampleTerrainHeight as rawSample } from "@/terrain/buildTerrain";
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants";
import type { TerrainMetrics } from "@/terrain/terrainFromBaseline";

// ────────────────────────────────────────────────────────────────────────────
// LIFT CONSTANTS — used by all overlays to prevent z-fighting
// ────────────────────────────────────────────────────────────────────────────

/** Path geometry lift above terrain surface */
export const PATH_LIFT = 0.025;
/** Marker geometry lift above terrain surface */
export const MARKER_LIFT = 0.04;
/** Label/Html overlay lift above terrain surface */
export const LABEL_LIFT = 0.06;

/**
 * Sample terrain height at world coordinates (x, z).
 * Returns the Y value at which the terrain surface sits.
 *
 * @param x - World X coordinate
 * @param z - World Z coordinate
 * @param seed - Terrain seed
 * @param metrics - Optional terrain metrics
 */
export function sampleTerrainHeight(
  x: number,
  z: number,
  seed: number,
  metrics?: TerrainMetrics,
): number {
  return rawSample(x, z, seed, TERRAIN_CONSTANTS, metrics);
}
