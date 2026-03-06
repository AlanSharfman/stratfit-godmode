// engine/terrain/generateMountainHeight.ts
// STRATFIT — Strategic Mountain Height Generator
//
// This module generates height displacement driven by business model results.
// It produces a secondary mountain surface that sits ON TOP of the procedural
// landscape, keeping business logic isolated from environmental terrain.
//
// The mountain is smaller than the landscape (~60% width) and centered.

import { smoothstep, pseudoNoise } from "./generateLandscapeHeight"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import {
  PRIMARY_KPI_KEYS,
  PRIMARY_ANCHOR_POSITIONS,
  HEALTH_ELEVATION,
  getHealthLevel,
} from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"

/* ═══════════════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════════════ */

const MOUNTAIN_PEAK_HEIGHT = 62
const NOISE_AMP = 0.12
const HEIGHT_SCALE = 1.5

/* ═══════════════════════════════════════════════════════════════════════════
   generateMountainHeight — Business-driven height at normalized (nx, nz)

   nx, nz ∈ [0, 1] — normalized coordinates across the mountain plane.
   kpis           — current KPI values from the simulation engine.
   seed           — for deterministic noise overlay.

   Returns: height displacement (additive on top of landscape).
            Returns 0 when kpis is null.
   ═══════════════════════════════════════════════════════════════════════════ */

export function generateMountainHeight(
  nx: number,
  nz: number,
  kpis: PositionKpis | null,
  seed: number,
): number {
  if (!kpis) return 0

  const anchors: { cx: number; spread: number; elev: number }[] = []
  for (const key of PRIMARY_KPI_KEYS) {
    const pos = PRIMARY_ANCHOR_POSITIONS.get(key)
    if (!pos) continue
    const healthElev = HEALTH_ELEVATION[getHealthLevel(key, kpis)]
    anchors.push({ cx: pos.cx, spread: pos.spread, elev: healthElev })
  }

  // Z-axis falloff: full influence at centre, fades toward front/back edges
  const zDist = Math.abs(nz - 0.5)
  const zFalloff = smoothstep(1, 0, zDist / 0.48)

  let totalHeight = 0
  let totalWeight = 0

  for (const a of anchors) {
    const dx = nx - a.cx
    const gWeight = Math.exp(-(dx * dx) / (a.spread * a.spread))
    if (gWeight < 0.005) continue

    const noise = pseudoNoise(nx * 20, nz * 20, seed + Math.floor(nx * 220)) * NOISE_AMP * MOUNTAIN_PEAK_HEIGHT
    totalHeight += (a.elev * MOUNTAIN_PEAK_HEIGHT * zFalloff + noise) * gWeight
    totalWeight += gWeight
  }

  if (totalWeight <= 0) return 0
  return (totalHeight / totalWeight) * HEIGHT_SCALE
}

/* ═══════════════════════════════════════════════════════════════════════════
   buildMountainHeightfield — Generates a complete mountain heightfield array.

   Returns a Float32Array of (segments+1)^2 heights for the mountain overlay.
   ═══════════════════════════════════════════════════════════════════════════ */

export function buildMountainHeightfield(
  kpis: PositionKpis | null,
  seed: number,
  segments: number,
): Float32Array {
  const vpr = segments + 1
  const count = vpr * vpr
  const hf = new Float32Array(count)

  for (let row = 0; row < vpr; row++) {
    for (let col = 0; col < vpr; col++) {
      const i = row * vpr + col
      const nx = col / segments
      const nz = row / segments
      hf[i] = generateMountainHeight(nx, nz, kpis, seed)
    }
  }

  return hf
}

/* ═══════════════════════════════════════════════════════════════════════════
   sampleMountainHeight — Point query for markers
   ═══════════════════════════════════════════════════════════════════════════ */

export function sampleMountainHeightAtWorld(
  worldX: number,
  worldZ: number,
  kpis: PositionKpis | null,
  seed: number,
  mountainWidth: number,
  mountainDepth: number,
): number {
  const nx = (worldX + mountainWidth * 0.5) / mountainWidth
  const nz = (worldZ + mountainDepth * 0.5) / mountainDepth
  if (nx < 0 || nx > 1 || nz < 0 || nz > 1) return 0
  return generateMountainHeight(nx, nz, kpis, seed)
}
