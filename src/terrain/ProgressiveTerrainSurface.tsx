// src/terrain/ProgressiveTerrainSurface.tsx
// Baseline-to-summit animated terrain driven by revealed KPI Terrain Stations.
// Always renders realistic mountainous terrain; KPI health modulates zone
// elevation on top of the baseline — the terrain is NEVER flat.

import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { useRenderFlagsStore } from "@/state/renderFlagsStore"
import { baselineSeedString, createSeed } from "@/terrain/seed"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"
import { createTerrainSolidMaterial, createTerrainWireMaterial } from "@/terrain/terrainMaterials"
import TerrainTrees from "@/terrain/TerrainTrees"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, KPI_ZONE_MAP, HEALTH_ELEVATION, getHealthLevel, getHealthColor, PRIMARY_KPI_KEYS, PRIMARY_ANCHOR_POSITIONS } from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import type { PropagationResult } from "@/engine/kpiDependencyGraph"
import type { TerrainTuningParams } from "@/terrain/terrainTuning"
import {
  generateLandscapeHeight,
  buildLandscapePeaks,
  stabilizeHeightfield as sharedStabilizeHeightfield,
  pseudoNoise as sharedPseudoNoise,
  valueNoise as sharedValueNoise,
  smoothstep as sharedSmoothstep,
  type LandscapePeak,
} from "@/engine/terrain/generateLandscapeHeight"

export type ProgressiveTerrainHandle = {
  getHeightAt: (worldX: number, worldZ: number) => number
  seed: number
  solidMesh: THREE.Mesh | null
  latticeMesh: THREE.Mesh | null
  heightfield: Float32Array | null
}

export interface CascadeImpulse {
  propagation: PropagationResult
  startTime: number
}

interface Props {
  revealedKpis: Set<KpiKey>
  kpis: PositionKpis | null
  focusedKpi: KpiKey | null
  cascadeImpulse?: CascadeImpulse | null
  tuning?: TerrainTuningParams | null
}

/* ═══════════════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════════════ */

const SEGMENTS = 220
const LERP_SPEED = 2.5

const BASELINE_RIDGE_HEIGHT = 40
const BASELINE_RIDGE_WIDTH = 0.18
const BASELINE_PEAK_COUNT = 13
const BASELINE_PEAK_AMP_MIN = 14
const BASELINE_PEAK_AMP_MAX = 48
const BASELINE_PEAK_SPREAD_MIN = 0.06
const BASELINE_PEAK_SPREAD_MAX = 0.20

const KPI_PEAK_HEIGHT = 62
const NOISE_AMP = 0.12

const MAX_SLOPE = 0.55
const SLOPE_CLAMP_PASSES = 3
const BROAD_SMOOTH_PASSES = 2
const BROAD_SMOOTH_STRENGTH = 0.13
const DETAIL_SMOOTH_PASSES = 1
const DETAIL_SMOOTH_THRESHOLD = 1.6
const KPI_BLEND_WIDTH = 0.075

const HIGHLIGHT_OPACITY = 0.35
const HIGHLIGHT_FADE = 4.0
const CASCADE_DELAY_PER_HOP = 0.15
const CASCADE_PULSE_DURATION = 0.8
const CASCADE_PULSE_AMP = 3.5

/* ═══════════════════════════════════════════════════════════════════════════
   Noise & math utilities
   ═══════════════════════════════════════════════════════════════════════════ */

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pseudoNoise(x: number, z: number, seed: number): number {
  const s = Math.sin(x * 12.9898 + z * 78.233 + seed * 43758.5453) * 43758.5453
  return s - Math.floor(s)
}

function valueNoise(x: number, z: number, seed: number): number {
  const ix = Math.floor(x), iz = Math.floor(z)
  const fx = x - ix, fz = z - iz
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz)
  const a = pseudoNoise(ix, iz, seed)
  const b = pseudoNoise(ix + 1, iz, seed)
  const c = pseudoNoise(ix, iz + 1, seed)
  const d = pseudoNoise(ix + 1, iz + 1, seed)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

function fbmNoise(x: number, z: number, seed: number, octaves = 4): number {
  let value = 0
  let amplitude = 1
  let frequency = 1
  let maxAmp = 0
  for (let i = 0; i < octaves; i++) {
    value += (valueNoise(x * frequency, z * frequency, seed + i * 97.13) * 2 - 1) * amplitude
    maxAmp += amplitude
    amplitude *= 0.48
    frequency *= 2.05
  }
  return value / maxAmp
}

function ridgedNoise(x: number, z: number, seed: number, octaves = 4): number {
  let value = 0
  let amplitude = 1
  let frequency = 1
  let maxAmp = 0
  for (let i = 0; i < octaves; i++) {
    const n = valueNoise(x * frequency, z * frequency, seed + i * 131.7)
    value += (1 - Math.abs(n * 2 - 1)) * amplitude
    maxAmp += amplitude
    amplitude *= 0.5
    frequency *= 2.2
  }
  return value / maxAmp
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/* ═══════════════════════════════════════════════════════════════════════════
   Seed-driven peak placement
   ═══════════════════════════════════════════════════════════════════════════ */

interface SeedPeak {
  x: number
  z: number
  amp: number
  spread: number
}

function buildSeedPeaks(seed: number): SeedPeak[] {
  const rand = mulberry32(seed)
  const peaks: SeedPeak[] = []

  // Primary peaks — the main mountain massifs
  for (let i = 0; i < BASELINE_PEAK_COUNT; i++) {
    const x = 0.08 + rand() * 0.84
    const z = 0.12 + rand() * 0.76
    const amp = BASELINE_PEAK_AMP_MIN + rand() * (BASELINE_PEAK_AMP_MAX - BASELINE_PEAK_AMP_MIN)
    const spread = BASELINE_PEAK_SPREAD_MIN + rand() * (BASELINE_PEAK_SPREAD_MAX - BASELINE_PEAK_SPREAD_MIN)
    peaks.push({ x, z, amp, spread })

    // Companion foothills near primary peaks
    if (rand() > 0.35) {
      const footX = x + (rand() - 0.5) * 0.16
      const footZ = z + (rand() - 0.5) * 0.16
      peaks.push({
        x: Math.max(0.04, Math.min(0.96, footX)),
        z: Math.max(0.04, Math.min(0.96, footZ)),
        amp: amp * (0.2 + rand() * 0.35),
        spread: spread * (1.4 + rand() * 0.9),
      })
    }
  }

  // Scattered small hillocks — random minor bumps across the landscape
  const hillockCount = 8 + Math.floor(rand() * 6)
  for (let i = 0; i < hillockCount; i++) {
    peaks.push({
      x: 0.03 + rand() * 0.94,
      z: 0.03 + rand() * 0.94,
      amp: 2 + rand() * 7,
      spread: 0.04 + rand() * 0.10,
    })
  }

  // Depressions / valleys — negative amplitude Gaussians carve basins
  const valleyCount = 3 + Math.floor(rand() * 5)
  for (let i = 0; i < valleyCount; i++) {
    peaks.push({
      x: 0.10 + rand() * 0.80,
      z: 0.10 + rand() * 0.80,
      amp: -(4 + rand() * 10),
      spread: 0.09 + rand() * 0.16,
    })
  }

  return peaks
}

/* ═══════════════════════════════════════════════════════════════════════════
   Baseline terrain height — always mountainous, never flat.
   Produces a realistic mountain range from seed alone.
   ═══════════════════════════════════════════════════════════════════════════ */

interface TuningOverrides {
  elevationScale: number
  ridgeIntensity: number
  valleyDepth: number
  roughness: number
  peakSoftness: number
  noiseFrequency: number
  microDetail: number
}

const NEUTRAL_TUNING: TuningOverrides = {
  elevationScale: 1, ridgeIntensity: 0.5, valleyDepth: 0.5,
  roughness: 0.5, peakSoftness: 0.5, noiseFrequency: 1, microDetail: 0.35,
}

function baselineTerrainHeight(
  nx: number,
  nz: number,
  seed: number,
  peaks: SeedPeak[],
  t: TuningOverrides = NEUTRAL_TUNING,
): number {
  const freqScale = 0.5 + t.noiseFrequency * 0.8

  // Main spine ridge running along X near Z = 0.5 with gentle wander
  const ridgeCenter = 0.5 + Math.sin(nx * Math.PI * 2.5 + seed * 0.07) * 0.06
  const ridgeDist = nz - ridgeCenter
  const ridgeProfile = Math.exp(
    -(ridgeDist * ridgeDist) / (BASELINE_RIDGE_WIDTH * BASELINE_RIDGE_WIDTH),
  )
  const ridgeUndulation = 0.55 + 0.45 * Math.sin(nx * Math.PI * 3.0 * freqScale + seed * 0.13)
  const ridge = BASELINE_RIDGE_HEIGHT * ridgeProfile * ridgeUndulation * (t.ridgeIntensity * 2)

  // Secondary spur ridges branching from the spine
  const spur1Dist = nz - (0.35 + Math.sin(nx * Math.PI * 4 + seed * 1.3) * 0.05)
  const spur1 = 8 * Math.exp(-(spur1Dist * spur1Dist) / 0.025) *
    smoothstep(0.2, 0.45, nx) * smoothstep(0.8, 0.55, nx) * t.ridgeIntensity * 2
  const spur2Dist = nz - (0.65 + Math.cos(nx * Math.PI * 3.5 + seed * 0.9) * 0.04)
  const spur2 = 6 * Math.exp(-(spur2Dist * spur2Dist) / 0.02) *
    smoothstep(0.3, 0.55, nx) * smoothstep(0.9, 0.65, nx) * t.ridgeIntensity * 2

  // Seed-driven peaks (Gaussian bumps) with natural overlap
  let peakContrib = 0
  const peakDamp = 1.0 - t.peakSoftness * 0.45
  for (const p of peaks) {
    const dx = nx - p.x
    const dz = nz - p.z
    const d2 = (dx * dx + dz * dz) / (p.spread * p.spread)
    peakContrib += p.amp * Math.exp(-d2) * peakDamp
  }

  // Ridged noise for realistic craggy ridgeline features
  const ridgedDetail = ridgedNoise(nx * 5 * freqScale, nz * 5 * freqScale, seed + 7, 4) * 6.0 * (0.3 + t.roughness * 0.8)

  // FBM for general terrain texture
  const roughAmp = 0.3 + t.roughness * 1.0
  const detailNoise = fbmNoise(nx * 7 * freqScale, nz * 7 * freqScale, seed, 5) * 4.0 * roughAmp
  const microNoise = fbmNoise(nx * 16 * freqScale, nz * 16 * freqScale, seed + 37, 3) * 1.5 * (t.microDetail * 2.5)

  // Broad terrain undulation — wide dramatic valleys and rises
  const valleyAmp = 0.5 + t.valleyDepth
  const broadWave =
    Math.sin(nx * Math.PI * 1.3 * freqScale + seed * 0.02) * 5.8 * valleyAmp +
    Math.cos(nz * Math.PI * 1.8 * freqScale - seed * 0.015) * 4.5 * valleyAmp

  // Edge falloff — gradual taper so terrain blends into background
  const edgeFade = Math.min(
    smoothstep(0, 0.22, nx),
    smoothstep(1, 0.78, nx),
    smoothstep(0, 0.16, nz),
    smoothstep(1, 0.84, nz),
  )

  const raw = (ridge + spur1 + spur2 + peakContrib + ridgedDetail + detailNoise + microNoise + broadWave) * t.elevationScale
  return raw * edgeFade - 2.0
}

/* ═══════════════════════════════════════════════════════════════════════════
   Heightfield Stabilization Pipeline
   All operations on Float32Array BEFORE mesh generation.

   Pipeline order:
     1. Iterative slope clamp (bidirectional, multi-pass until stable)
     2. Pass A — broad Laplacian smoothing (removes large discontinuities)
     3. Pass B — edge-preserving smoothing (keeps ridges, softens noise)
   ═══════════════════════════════════════════════════════════════════════════ */

function stabilizeHeightfield(hf: Float32Array, vpr: number): void {
  const count = hf.length

  // ── Step 1: Iterative slope clamp (hard constraint) ──────────────────
  // Sweep forward then backward each pass so clamp propagates both ways.
  // Iterate until no violations remain or max passes reached.
  for (let pass = 0; pass < SLOPE_CLAMP_PASSES; pass++) {
    let violations = 0

    // Forward sweep (top-left → bottom-right)
    for (let row = 0; row < vpr; row++) {
      for (let col = 0; col < vpr; col++) {
        const i = row * vpr + col
        // Clamp vs left neighbour
        if (col > 0) {
          const left = hf[i - 1]
          const diff = hf[i] - left
          if (Math.abs(diff) > MAX_SLOPE) {
            hf[i] = left + Math.sign(diff) * MAX_SLOPE
            violations++
          }
        }
        // Clamp vs top neighbour
        if (row > 0) {
          const above = hf[i - vpr]
          const diff = hf[i] - above
          if (Math.abs(diff) > MAX_SLOPE) {
            hf[i] = above + Math.sign(diff) * MAX_SLOPE
            violations++
          }
        }
      }
    }

    // Backward sweep (bottom-right → top-left)
    for (let row = vpr - 1; row >= 0; row--) {
      for (let col = vpr - 1; col >= 0; col--) {
        const i = row * vpr + col
        if (col < vpr - 1) {
          const right = hf[i + 1]
          const diff = hf[i] - right
          if (Math.abs(diff) > MAX_SLOPE) {
            hf[i] = right + Math.sign(diff) * MAX_SLOPE
            violations++
          }
        }
        if (row < vpr - 1) {
          const below = hf[i + vpr]
          const diff = hf[i] - below
          if (Math.abs(diff) > MAX_SLOPE) {
            hf[i] = below + Math.sign(diff) * MAX_SLOPE
            violations++
          }
        }
      }
    }

    // Also clamp diagonals (8-connected) for thorough coverage
    for (let row = 1; row < vpr - 1; row++) {
      for (let col = 1; col < vpr - 1; col++) {
        const i = row * vpr + col
        const diag = MAX_SLOPE * 1.414
        const corners = [
          i - vpr - 1, i - vpr + 1,
          i + vpr - 1, i + vpr + 1,
        ]
        for (const ni of corners) {
          const diff = hf[i] - hf[ni]
          if (Math.abs(diff) > diag) {
            hf[i] = hf[ni] + Math.sign(diff) * diag
            violations++
          }
        }
      }
    }

    if (violations === 0) break
  }

  // ── Step 2: Pass A — broad Laplacian smoothing ───────────────────────
  const tmp = new Float32Array(count)
  for (let pass = 0; pass < BROAD_SMOOTH_PASSES; pass++) {
    tmp.set(hf)
    for (let row = 1; row < vpr - 1; row++) {
      for (let col = 1; col < vpr - 1; col++) {
        const i = row * vpr + col
        const avg4 = (tmp[i - 1] + tmp[i + 1] + tmp[i - vpr] + tmp[i + vpr]) * 0.25
        hf[i] = tmp[i] * (1 - BROAD_SMOOTH_STRENGTH) + avg4 * BROAD_SMOOTH_STRENGTH
      }
    }
  }

  // ── Step 3: Pass B — edge-preserving smoothing ───────────────────────
  // Strong smooth where curvature is high (discontinuities), weak where
  // surface is already smooth (preserves ridges and valleys).
  for (let pass = 0; pass < DETAIL_SMOOTH_PASSES; pass++) {
    tmp.set(hf)
    for (let row = 1; row < vpr - 1; row++) {
      for (let col = 1; col < vpr - 1; col++) {
        const i = row * vpr + col
        const c = tmp[i]
        const avg4 = (tmp[i - 1] + tmp[i + 1] + tmp[i - vpr] + tmp[i + vpr]) * 0.25
        const curvature = Math.abs(c - avg4)
        const s = curvature > DETAIL_SMOOTH_THRESHOLD
          ? 0.35
          : curvature > 0.4 ? 0.12 : 0.02
        hf[i] = c * (1 - s) + avg4 * s
      }
    }
  }

  // ── Step 4: Peak and valley rounding ─────────────────────────────────
  // Redistribute single-vertex extrema so peaks/troughs have natural mass.
  // Uses a 3×3 neighbourhood: if centre is a local max/min that exceeds
  // neighbours by more than a threshold, blend it toward the average.
  const PEAK_ROUND_THRESHOLD = 1.6
  const PEAK_ROUND_STRENGTH = 0.3
  tmp.set(hf)
  for (let row = 1; row < vpr - 1; row++) {
    for (let col = 1; col < vpr - 1; col++) {
      const i = row * vpr + col
      const c = tmp[i]
      const n = [
        tmp[i - 1], tmp[i + 1], tmp[i - vpr], tmp[i + vpr],
        tmp[i - vpr - 1], tmp[i - vpr + 1], tmp[i + vpr - 1], tmp[i + vpr + 1],
      ]
      let nMax = -Infinity, nMin = Infinity, nSum = 0
      for (let k = 0; k < 8; k++) {
        if (n[k] > nMax) nMax = n[k]
        if (n[k] < nMin) nMin = n[k]
        nSum += n[k]
      }
      const nAvg = nSum / 8
      const excessAbove = c - nMax
      const excessBelow = nMin - c
      if (excessAbove > PEAK_ROUND_THRESHOLD) {
        hf[i] = c * (1 - PEAK_ROUND_STRENGTH) + nAvg * PEAK_ROUND_STRENGTH
      } else if (excessBelow > PEAK_ROUND_THRESHOLD) {
        hf[i] = c * (1 - PEAK_ROUND_STRENGTH) + nAvg * PEAK_ROUND_STRENGTH
      }
    }
  }
}

/**
 * Build a fully stabilized heightfield combining baseline terrain + KPI zone overlays.
 * Returns a Float32Array of vertex heights ready to be written to geometry.
 */
function buildStabilizedHeightfield(
  seed: number,
  seedPeaks: SeedPeak[],
  kpis: PositionKpis | null,
  tuning?: TerrainTuningParams | null,
): Float32Array {
  const vpr = SEGMENTS + 1
  const count = vpr * vpr
  const hf = new Float32Array(count)

  const t: TuningOverrides = tuning ? {
    elevationScale: tuning.elevationScale,
    ridgeIntensity: tuning.ridgeIntensity,
    valleyDepth: tuning.valleyDepth,
    roughness: tuning.terrainRoughness,
    peakSoftness: tuning.peakSoftness,
    noiseFrequency: tuning.noiseFrequency,
    microDetail: tuning.microDetailStrength,
  } : NEUTRAL_TUNING

  // Phase 1: raw baseline heights
  for (let row = 0; row < vpr; row++) {
    for (let col = 0; col < vpr; col++) {
      const i = row * vpr + col
      const nx = col / SEGMENTS
      const nz = row / SEGMENTS
      hf[i] = baselineTerrainHeight(nx, nz, seed, seedPeaks, t)
    }
  }

  // Phase 2: 6-anchor KPI elevation model
  // Each primary KPI acts as a terrain anchor with Gaussian falloff.
  // Healthy anchors raise the terrain (peaks/ridges), critical anchors lower it (valleys).
  // Gaussians overlap naturally, producing smooth cubic-like transitions.
  if (kpis) {
    const anchors: { cx: number; spread: number; elev: number }[] = []
    for (const key of PRIMARY_KPI_KEYS) {
      const pos = PRIMARY_ANCHOR_POSITIONS.get(key)
      if (!pos) continue
      const healthElev = HEALTH_ELEVATION[getHealthLevel(key, kpis)]
      anchors.push({ cx: pos.cx, spread: pos.spread, elev: healthElev })
    }

    for (let row = 0; row < vpr; row++) {
      for (let col = 0; col < vpr; col++) {
        const i = row * vpr + col
        const nx = col / SEGMENTS
        const nz = row / SEGMENTS

        // Z-axis falloff: full influence at centre, fades toward front/back edges
        const zDist = Math.abs(nz - 0.5)
        const zFalloff = smoothstep(1, 0, zDist / 0.48)

        let totalHeight = 0
        let totalWeight = 0

        for (const a of anchors) {
          const dx = nx - a.cx
          const gWeight = Math.exp(-(dx * dx) / (a.spread * a.spread))
          if (gWeight < 0.005) continue

          const noise = pseudoNoise(nx * 20, nz * 20, seed + col) * NOISE_AMP * KPI_PEAK_HEIGHT
          totalHeight += (a.elev * KPI_PEAK_HEIGHT * zFalloff + noise) * gWeight
          totalWeight += gWeight
        }

        if (totalWeight > 0) {
          hf[i] += totalHeight / totalWeight
        }
      }
    }
  }

  // Phase 3: stabilize the COMBINED heightfield (slope clamp + multi-scale smooth)
  stabilizeHeightfield(hf, vpr)

  // Phase 4: multi-scale surface noise — natural roughness at two frequencies
  for (let row = 0; row < vpr; row++) {
    for (let col = 0; col < vpr; col++) {
      const i = row * vpr + col
      const n1 = valueNoise(col * 0.8, row * 0.8, seed + 4217) * 2 - 1
      const n2 = valueNoise(col * 2.5, row * 2.5, seed + 7731) * 2 - 1
      hf[i] += n1 * 0.25 + n2 * 0.12
    }
  }

  return hf
}

/* ═══════════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════════ */

const ProgressiveTerrainSurface = forwardRef<ProgressiveTerrainHandle, Props>(
  function ProgressiveTerrainSurface({ revealedKpis, kpis, focusedKpi, cascadeImpulse, tuning }, ref) {
    const solidRef = useRef<THREE.Mesh>(null)
    const latticeRef = useRef<THREE.Mesh>(null)
    const highlightRef = useRef<THREE.Mesh>(null)
    const highlightMatRef = useRef<THREE.MeshBasicMaterial>(null)
    const highlightOpacity = useRef(0)

    const { baseline } = useSystemBaseline()
    const showGrid = useRenderFlagsStore((s) => s.showGrid)
    const baselineAny = baseline as any
    const seedStr = useMemo(() => baselineSeedString(baselineAny), [baselineAny])
    const seed = useMemo(() => createSeed(seedStr), [seedStr])
    const seedPeaks = useMemo(() => buildSeedPeaks(seed), [seed])

    // Stabilized heightfield: baseline + KPI zones, slope-clamped and smoothed.
    // This is the SINGLE source of truth for all vertex heights.
    const stabilizedHF = useMemo(
      () => buildStabilizedHeightfield(seed, seedPeaks, kpis, tuning),
      [seed, seedPeaks, kpis, tuning],
    )

    // Build geometry — write stabilized heightfield directly to mesh
    const geometry = useMemo(() => {
      const geo = new THREE.PlaneGeometry(
        TERRAIN_CONSTANTS.width,
        TERRAIN_CONSTANTS.depth,
        SEGMENTS,
        SEGMENTS,
      )
      const pos = geo.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < pos.count; i++) {
        pos.setZ(i, stabilizedHF[i])
      }
      geo.computeVertexNormals()
      geo.computeBoundingSphere()
      return geo
    }, [stabilizedHF])

    // Target heights = stabilized heightfield (already clean, no further processing needed)
    const targetHeights = stabilizedHF

    // Highlight geometry for focused KPI anchor region
    const highlightGeo = useMemo(() => {
      if (!focusedKpi || !kpis) return null

      const anchor = PRIMARY_ANCHOR_POSITIONS.get(focusedKpi)
      const health = getHealthLevel(focusedKpi, kpis)
      const color = getHealthColor(health)
      const pos = geometry.attributes.position as THREE.BufferAttribute
      const count = pos.count
      const vertsPerRow = SEGMENTS + 1
      const aCx = anchor?.cx ?? 0.5
      const aSpread = anchor?.spread ?? 0.11

      const geo = new THREE.PlaneGeometry(
        TERRAIN_CONSTANTS.width,
        TERRAIN_CONSTANTS.depth,
        SEGMENTS,
        SEGMENTS,
      )
      const hPos = geo.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < count; i++) {
        hPos.setZ(i, pos.getZ(i))
      }

      const colors = new Float32Array(count * 3)
      for (let i = 0; i < count; i++) {
        const col = i % vertsPerRow
        const nx = col / SEGMENTS
        const h = pos.getZ(i)

        if (h < 0.2) continue

        const dx = nx - aCx
        const zoneFactor = Math.exp(-(dx * dx) / (aSpread * aSpread))
        if (zoneFactor < 0.05) continue

        const heightFactor = Math.min(1, h / 5)
        const intensity = heightFactor * zoneFactor

        colors[i * 3] = color.r * intensity
        colors[i * 3 + 1] = color.g * intensity
        colors[i * 3 + 2] = color.b * intensity
      }

      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3))
      geo.computeVertexNormals()
      return geo
    }, [focusedKpi, kpis, geometry])

    // Precompute cascade pulse offsets per zone for quick lookup
    const cascadeZonePulse = useRef(new Map<KpiKey, number>())

    // Animate vertex heights toward targets + cascade pulses
    useFrame((state, delta) => {
      const pos = geometry.attributes.position as THREE.BufferAttribute
      const count = pos.count
      let changed = false
      const vertsPerRow = SEGMENTS + 1

      // Cascade pulse computation
      cascadeZonePulse.current.clear()
      if (cascadeImpulse) {
        const elapsed = state.clock.elapsedTime - cascadeImpulse.startTime
        const { affected, hops } = cascadeImpulse.propagation
        for (const [kpi, impactDelta] of affected) {
          const hop = hops.get(kpi) ?? 0
          const localT = elapsed - hop * CASCADE_DELAY_PER_HOP
          if (localT > 0 && localT < CASCADE_PULSE_DURATION) {
            const t = localT / CASCADE_PULSE_DURATION
            const envelope = Math.sin(t * Math.PI)
            cascadeZonePulse.current.set(kpi, envelope * Math.sign(impactDelta) * CASCADE_PULSE_AMP * Math.min(1, Math.abs(impactDelta) * 5))
          }
        }
      }

      for (let i = 0; i < count; i++) {
        const col = i % vertsPerRow
        const nx = col / SEGMENTS

        let cascadeOffset = 0
        if (cascadeZonePulse.current.size > 0) {
          for (const [kpi, pulse] of cascadeZonePulse.current) {
            const zone = KPI_ZONE_MAP[kpi]
            if (nx >= zone.xStart - 0.02 && nx <= zone.xEnd + 0.02) {
              const dLeft = nx - zone.xStart
              const dRight = zone.xEnd - nx
              const zf = Math.min(Math.max(dLeft / 0.04, 0), 1) * Math.min(Math.max(dRight / 0.04, 0), 1)
              cascadeOffset += pulse * zf
            }
          }
        }

        const current = pos.getZ(i)
        const target = targetHeights[i] + cascadeOffset
        const diff = target - current
        if (Math.abs(diff) > 0.01) {
          pos.setZ(i, current + diff * Math.min(1, delta * LERP_SPEED))
          changed = true
        }
      }

      if (changed) {
        pos.needsUpdate = true
        geometry.computeVertexNormals()
      }

      // Update highlight geometry heights to match
      if (highlightGeo && highlightRef.current) {
        const hPos = highlightGeo.attributes.position as THREE.BufferAttribute
        for (let i = 0; i < count; i++) {
          hPos.setZ(i, pos.getZ(i))
        }
        hPos.needsUpdate = true
        highlightGeo.computeVertexNormals()
      }

      // Fade highlight opacity
      const targetOp = focusedKpi ? HIGHLIGHT_OPACITY : 0
      const curOp = highlightOpacity.current
      const opDiff = targetOp - curOp
      if (Math.abs(opDiff) > 0.001) {
        highlightOpacity.current += opDiff * Math.min(1, delta * HIGHLIGHT_FADE)
      } else {
        highlightOpacity.current = targetOp
      }
      if (highlightMatRef.current) {
        highlightMatRef.current.opacity = highlightOpacity.current
      }
    })

    // Materials
    const solidMat = useMemo(() => createTerrainSolidMaterial(), [])
    const wireMat = useMemo(() => createTerrainWireMaterial(), [])
    useEffect(() => () => solidMat.dispose(), [solidMat])
    useEffect(() => () => wireMat.dispose(), [wireMat])
    useEffect(() => () => { geometry.dispose() }, [geometry])
    useEffect(() => () => { highlightGeo?.dispose() }, [highlightGeo])

    // Transform — same as TerrainSurface
    useEffect(() => {
      for (const r of [solidRef, latticeRef, highlightRef]) {
        if (!r.current) continue
        r.current.rotation.x = -Math.PI / 2
        r.current.position.set(0, -6, 0)
        r.current.scale.set(3.0, 2.8, 2.6)
        r.current.frustumCulled = false
      }
    }, [highlightGeo])

    useImperativeHandle(ref, () => ({
      seed,
      solidMesh: solidRef.current,
      latticeMesh: latticeRef.current,
      heightfield: stabilizedHF,
      getHeightAt: (worldX: number, worldZ: number) => {
        const geomX = worldX / 3.0
        const geomZ = worldZ / 2.6
        const halfW = TERRAIN_CONSTANTS.width / 2
        const halfD = TERRAIN_CONSTANTS.depth / 2
        const col = Math.round(((geomX + halfW) / TERRAIN_CONSTANTS.width) * SEGMENTS)
        const row = Math.round(((geomZ + halfD) / TERRAIN_CONSTANTS.depth) * SEGMENTS)
        const clampedCol = Math.max(0, Math.min(SEGMENTS, col))
        const clampedRow = Math.max(0, Math.min(SEGMENTS, row))
        const idx = clampedRow * (SEGMENTS + 1) + clampedCol
        const pos = geometry.attributes.position as THREE.BufferAttribute
        const h = pos.getZ(idx) ?? 0
        return h * 2.8 + TERRAIN_CONSTANTS.yOffset
      },
    }), [seed, geometry, stabilizedHF])

    return (
      <>
        <mesh
          ref={solidRef}
          geometry={geometry}
          renderOrder={0}
          name="progressive-terrain-surface"
        >
          <primitive object={solidMat} attach="material" />
        </mesh>

        {showGrid && (
          <mesh ref={latticeRef} geometry={geometry} renderOrder={1} name="progressive-terrain-lattice">
            <primitive object={wireMat} attach="material" />
          </mesh>
        )}

        {highlightGeo && (
          <mesh
            ref={highlightRef}
            geometry={highlightGeo}
            renderOrder={6}
            name="progressive-zone-highlight"
          >
            <meshBasicMaterial
              ref={highlightMatRef}
              vertexColors
              transparent
              opacity={0}
              depthWrite={false}
              depthTest
              side={THREE.DoubleSide}
              polygonOffset
              polygonOffsetFactor={-2}
              polygonOffsetUnits={-2}
              toneMapped={false}
            />
          </mesh>
        )}

        <TerrainTrees
          terrainRef={ref as React.RefObject<ProgressiveTerrainHandle>}
          heightfield={stabilizedHF}
          seed={seed}
        />
      </>
    )
  },
)

export default ProgressiveTerrainSurface
