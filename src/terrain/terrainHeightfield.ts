// src/terrain/terrainHeightfield.ts
// Heightfield generation pipeline: seed peaks, strategic skeleton, baseline
// terrain, stabilization, and the combined build function.

import { mulberry32, pseudoNoise, valueNoise, fbmNoise, ridgedNoise, smoothstep } from "@/terrain/terrainNoise"
import { KPI_KEYS, KPI_ZONE_MAP, HEALTH_ELEVATION, getHealthLevel, PRIMARY_KPI_KEYS, PRIMARY_ANCHOR_POSITIONS } from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import type { TerrainTuningParams } from "@/terrain/terrainTuning"

/* ═══════════════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════════════ */

export const SEGMENTS = 220

const BASELINE_RIDGE_HEIGHT = 110
const BASELINE_RIDGE_WIDTH = 0.13
const BASELINE_PEAK_COUNT = 13
const BASELINE_PEAK_AMP_MIN = 38
const BASELINE_PEAK_AMP_MAX = 130
const BASELINE_PEAK_SPREAD_MIN = 0.06
const BASELINE_PEAK_SPREAD_MAX = 0.20

/** Strategic-vs-procedural weighting — skeleton dominates the mountain form */
const STRATEGIC_WEIGHT = 0.80
const PROCEDURAL_WEIGHT = 0.20

const MAX_SLOPE = 2.8
const SLOPE_CLAMP_PASSES = 2
const BROAD_SMOOTH_PASSES = 1
const BROAD_SMOOTH_STRENGTH = 0.06
const DETAIL_SMOOTH_PASSES = 1
const DETAIL_SMOOTH_THRESHOLD = 6.0

const SKELETON_PEAK_HEIGHT = 240

/* ═══════════════════════════════════════════════════════════════════════════
   Seed-driven peak placement
   ═══════════════════════════════════════════════════════════════════════════ */

export interface SeedPeak {
  x: number
  z: number
  amp: number
  spread: number
}

export function buildSeedPeaks(seed: number): SeedPeak[] {
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
   Strategic Skeleton — KPI-driven core mountain form.
   This defines WHERE the summit, ridge, valley, and erosion zones exist.
   The skeleton is the primary shape; procedural noise only adds realism.

   Mapping:
     Enterprise Value  → dominant peak height
     Growth            → main ridge strength & extension
     Liquidity (cash)  → valley basin depth
     Runway            → terrain stability / smoothness
     Revenue           → slope steepness / elevation continuity
     Burn              → erosion / weakening / fragmentation
   ═══════════════════════════════════════════════════════════════════════════ */

export function generateStrategicSkeleton(
  nx: number,
  nz: number,
  kpis: PositionKpis,
  seed: number,
): number {
  const anchors: { cx: number; spread: number; elev: number; key: string }[] = []
  for (const key of PRIMARY_KPI_KEYS) {
    const pos = PRIMARY_ANCHOR_POSITIONS.get(key)
    if (!pos) continue
    const healthElev = HEALTH_ELEVATION[getHealthLevel(key, kpis)]
    anchors.push({ cx: pos.cx, spread: pos.spread, elev: healthElev, key })
  }

  const zCenter = 0.5
  const zDist = Math.abs(nz - zCenter)
  const zFalloff = smoothstep(1, 0, zDist / 0.46)

  let totalHeight = 0
  let totalWeight = 0

  for (const a of anchors) {
    const dx = nx - a.cx
    const gWeight = Math.exp(-(dx * dx) / (a.spread * a.spread))
    if (gWeight < 0.003) continue

    let anchorH = a.elev * SKELETON_PEAK_HEIGHT * zFalloff

    if (a.key === "enterpriseValue" && a.elev > 0) {
      const peakSharpness = 1.0 + a.elev * 0.4
      anchorH *= peakSharpness
    }

    if (a.key === "growth" && a.elev > 0) {
      const ridgeExt = 1.0 + 0.3 * Math.sin(nx * Math.PI * 4 + seed * 0.05)
      anchorH *= ridgeExt
    }

    if (a.key === "burn" && a.elev < 0) {
      const erosionNoise = pseudoNoise(nx * 30, nz * 30, seed + 991) * 0.4
      anchorH *= (1.0 + erosionNoise)
    }

    totalHeight += anchorH * gWeight
    totalWeight += gWeight
  }

  if (totalWeight < 0.001) return 0

  let h = totalHeight / totalWeight

  const spineCenter = zCenter + Math.sin(nx * Math.PI * 2.2 + seed * 0.05) * 0.04
  const spineDist = nz - spineCenter
  const spineProfile = Math.exp(-(spineDist * spineDist) / (0.14 * 0.14))
  const avgElev = anchors.reduce((s, a) => s + a.elev, 0) / anchors.length
  h += spineProfile * Math.max(avgElev, 0.15) * SKELETON_PEAK_HEIGHT * 0.35

  const edgeFade = Math.min(
    smoothstep(0, 0.18, nx),
    smoothstep(1, 0.82, nx),
    smoothstep(0, 0.14, nz),
    smoothstep(1, 0.86, nz),
  )

  return h * edgeFade
}

/* ═══════════════════════════════════════════════════════════════════════════
   Baseline terrain height — procedural realism layer.
   Provides natural texture, asymmetry, ridge roughness, and surface detail.
   Must NOT decide the core mountain meaning — only supports naturalism.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface TuningOverrides {
  elevationScale: number
  ridgeIntensity: number
  valleyDepth: number
  roughness: number
  peakSoftness: number
  noiseFrequency: number
  microDetail: number
}

export const NEUTRAL_TUNING: TuningOverrides = {
  elevationScale: 1, ridgeIntensity: 0.5, valleyDepth: 0.5,
  roughness: 0.5, peakSoftness: 0.5, noiseFrequency: 1, microDetail: 0.35,
}

export function baselineTerrainHeight(
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
  // Quadratic curve: lower half is subtle, upper half is dramatically craggy
  const ridgedDetail = ridgedNoise(nx * 5 * freqScale, nz * 5 * freqScale, seed + 7, 4) * 6.0 * (t.roughness * t.roughness * 3.2 + 0.08)

  // FBM for general terrain texture — quadratic for same reason
  const roughAmp = t.roughness * t.roughness * 2.8 + 0.12
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

export function stabilizeHeightfield(hf: Float32Array, vpr: number): void {
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
          ? 0.22
          : curvature > 0.4 ? 0.06 : 0.01
        hf[i] = c * (1 - s) + avg4 * s
      }
    }
  }

  // ── Step 4: Peak and valley rounding ─────────────────────────────────
  // Redistribute single-vertex extrema so peaks/troughs have natural mass.
  // Uses a 3×3 neighbourhood: if centre is a local max/min that exceeds
  // neighbours by more than a threshold, blend it toward the average.
  const PEAK_ROUND_THRESHOLD = 6.0
  const PEAK_ROUND_STRENGTH = 0.15
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
export function buildStabilizedHeightfield(
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

  // Phase 1: Strategic skeleton (primary shape) + procedural realism (texture)
  // The skeleton defines where peaks, ridges, valleys, and erosion exist.
  // The procedural layer adds naturalism and surface texture only.
  for (let row = 0; row < vpr; row++) {
    for (let col = 0; col < vpr; col++) {
      const i = row * vpr + col
      const nx = col / SEGMENTS
      const nz = row / SEGMENTS

      const procedural = baselineTerrainHeight(nx, nz, seed, seedPeaks, t)

      if (kpis) {
        const skeleton = generateStrategicSkeleton(nx, nz, kpis, seed)
        hf[i] = skeleton * STRATEGIC_WEIGHT + procedural * PROCEDURAL_WEIGHT
      } else {
        hf[i] = procedural
      }
    }
  }

  // Phase 2: stabilize the COMBINED heightfield (slope clamp + multi-scale smooth)
  stabilizeHeightfield(hf, vpr)

  // Phase 3: multi-scale surface noise — scales with roughness so upper slider range is visible
  const surfaceRoughScale = 0.18 + t.roughness * 2.0
  for (let row = 0; row < vpr; row++) {
    for (let col = 0; col < vpr; col++) {
      const i = row * vpr + col
      const n1 = valueNoise(col * 0.8, row * 0.8, seed + 4217) * 2 - 1
      const n2 = valueNoise(col * 2.5, row * 2.5, seed + 7731) * 2 - 1
      hf[i] += (n1 * 0.25 + n2 * 0.12) * surfaceRoughScale
    }
  }

  // Phase 4: Valley corridor smooth — suppresses the broadWave cos(nz·π·1.8) ripple bands
  // that appear as stacked contour lines in the Liquidity→Revenue corridor (nx 0.20–0.50).
  // Slope-weighted Laplacian: flat valley floor gets maximum smoothing; steep mountain
  // faces get near-zero so peak silhouettes are completely preserved.
  {
    const tmp5 = new Float32Array(vpr * vpr)
    const cellW = 420 / SEGMENTS
    const cellD = 270 / SEGMENTS
    const hApprox = 110
    const PASSES = 6
    for (let pass = 0; pass < PASSES; pass++) {
      tmp5.set(hf)
      for (let row = 1; row < vpr - 1; row++) {
        for (let col = 1; col < vpr - 1; col++) {
          const nx = col / SEGMENTS
          const corridorBlend =
            smoothstep(0.20, 0.30, nx) * smoothstep(0.52, 0.42, nx)
          if (corridorBlend <= 0.001) continue

          const i = row * vpr + col
          const hL  = tmp5[Math.max(col - 1, 0)       + row * vpr]
          const hR  = tmp5[Math.min(col + 1, vpr - 1) + row * vpr]
          const hUp = tmp5[col + Math.max(row - 1, 0)       * vpr]
          const hDw = tmp5[col + Math.min(row + 1, vpr - 1) * vpr]
          const gx5 = ((hR  - hL)  / (2 * cellW)) * hApprox
          const gz5 = ((hDw - hUp) / (2 * cellD)) * hApprox
          const slope5 = 1 - 1 / Math.sqrt(1 + gx5 * gx5 + gz5 * gz5)
          // Flat → full smoothing; steep face → zero (silhouette safe)
          const flatness = 1 - smoothstep(0.0, 0.42, slope5)
          const avg4 = (tmp5[i - 1] + tmp5[i + 1] + tmp5[i - vpr] + tmp5[i + vpr]) * 0.25
          hf[i] = tmp5[i] * (1 - 0.45 * corridorBlend * flatness) +
                  avg4   * (      0.45 * corridorBlend * flatness)
        }
      }
    }
  }

  return hf
}
