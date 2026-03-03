// src/domain/terrain/renderContract.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Render Contract (God Mode)
//
// Single canonical type describing what the terrain is currently rendering,
// what data is present, what layers are mounted, and camera state.
// Used by debug panel, invariant assertions, and future AI trajectory gating.
// ═══════════════════════════════════════════════════════════════════════════

export interface TerrainRenderContract {
  /** Whether engine results exist for this context */
  hasEngineResults: boolean
  runId?: string
  completedAt?: string | number
  seed?: number | string

  // ── Data presence ──
  eventCount: number
  hasPath: boolean
  pathPointCount: number
  hasHeatmapField: boolean
  heatmapSize?: { w: number; h: number }
  hasTerrainMetrics: boolean
  horizonMonths?: number

  // ── Layer mount flags (actual render state, not desired) ──
  layers: {
    terrainMesh: boolean
    p50Path: boolean
    signals: boolean
    focusGlow: boolean
    tether: boolean
    heatmap: boolean
    annotations: boolean
    legend: boolean
  }

  // ── Mode / toggles snapshot ──
  mode?: string
  viewMode?: string
  toggles?: Record<string, boolean>

  // ── Camera snapshot ──
  camera: {
    pos: [number, number, number]
    target: [number, number, number]
    fov: number
  }
}
