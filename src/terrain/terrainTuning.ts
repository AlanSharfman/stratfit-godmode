// src/terrain/terrainTuning.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Tuning Parameter Contract (shared)
//
// Single source of truth for tuning types + defaults.
// Used by: PositionPage (V1 pipeline), TerrainTuningPanel, TerrainSurfaceV2.
// ═══════════════════════════════════════════════════════════════════════════

export type TerrainTuningParams = {
  elevationScale: number      // 0–2
  ridgeIntensity: number      // 0–1
  valleyDepth: number         // 0–1
  terrainRoughness: number    // 0–1
  peakSoftness: number        // 0–1
  noiseFrequency: number      // 0–3
  microDetailStrength: number // 0–1
}

export const DEFAULT_TUNING: TerrainTuningParams = {
  elevationScale: 1.22,
  ridgeIntensity: 0.62,
  valleyDepth: 0.52,
  terrainRoughness: 0.45,
  peakSoftness: 0.56,
  noiseFrequency: 0.85,
  microDetailStrength: 0.35,
}
