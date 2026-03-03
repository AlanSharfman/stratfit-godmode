// src/domain/terrain/buildRenderContract.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Build Render Contract (God Mode)
//
// Pure deterministic assembly — no DOM, no hooks, no side effects.
// Assembles a TerrainRenderContract from engine results + layer flags +
// mode state + camera snapshot.
// ═══════════════════════════════════════════════════════════════════════════

import type { TerrainRenderContract } from "./renderContract"

export interface BuildRenderContractArgs {
  /** Engine results — any shape; we extract known fields safely. */
  engineResults?: Record<string, unknown> | null
  completedAt?: string | number | null
  eventCount: number
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
  hasTerrainMetrics: boolean
  mode?: string
  viewMode?: string
  toggles?: Record<string, boolean>
  camera: {
    pos: [number, number, number]
    target: [number, number, number]
    fov: number
  }
}

export function buildRenderContract(args: BuildRenderContractArgs): TerrainRenderContract {
  const {
    engineResults,
    completedAt,
    eventCount,
    layers,
    hasTerrainMetrics,
    mode,
    viewMode,
    toggles,
    camera,
  } = args

  const hasEngineResults = !!engineResults
  const p50 = (engineResults?.p50Series ?? engineResults?.valueSeries ?? []) as number[]
  const runId = (engineResults?.run_id ?? engineResults?.completedAt ?? undefined) as string | undefined
  const seed = (engineResults?.seed ?? undefined) as number | undefined
  const horizonMonths = (engineResults?.horizon_months ?? engineResults?.horizonMonths ?? undefined) as number | undefined

  return {
    hasEngineResults,
    runId,
    completedAt: completedAt ?? undefined,
    seed,

    eventCount,
    hasPath: p50.length > 0,
    pathPointCount: p50.length,
    hasHeatmapField: false,
    hasTerrainMetrics,
    horizonMonths,

    layers,
    mode,
    viewMode,
    toggles,
    camera,
  }
}
