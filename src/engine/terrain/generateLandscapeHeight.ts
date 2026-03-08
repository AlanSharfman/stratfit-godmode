// engine/terrain/generateLandscapeHeight.ts
// STRATFIT — Pure Procedural Landscape Height Generator
//
// This module contains ALL noise and procedural terrain logic.
// It produces a realistic mountain landscape from a seed alone.
//
// HARD RULE: This module must NEVER import or reference any business model,
// KPI, scenario, or engine results data. It is purely environmental.

/* ═══════════════════════════════════════════════════════════════════════════
   PRNG — Mulberry32 (deterministic, fast, seedable)
   ═══════════════════════════════════════════════════════════════════════════ */

export function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Noise Primitives
   ═══════════════════════════════════════════════════════════════════════════ */

export function pseudoNoise(x: number, z: number, seed: number): number {
  const s = Math.sin(x * 12.9898 + z * 78.233 + seed * 43758.5453) * 43758.5453
  return s - Math.floor(s)
}

export function valueNoise(x: number, z: number, seed: number): number {
  const ix = Math.floor(x), iz = Math.floor(z)
  const fx = x - ix, fz = z - iz
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz)
  const a = pseudoNoise(ix, iz, seed)
  const b = pseudoNoise(ix + 1, iz, seed)
  const c = pseudoNoise(ix, iz + 1, seed)
  const d = pseudoNoise(ix + 1, iz + 1, seed)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

export function fbmNoise(x: number, z: number, seed: number, octaves = 4): number {
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

export function ridgedNoise(x: number, z: number, seed: number, octaves = 4): number {
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

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/* ═══════════════════════════════════════════════════════════════════════════
   Seed-driven Peak Placement
   ═══════════════════════════════════════════════════════════════════════════ */

export interface LandscapePeak {
  x: number
  z: number
  amp: number
  spread: number
}

const PEAK_COUNT = 13
const PEAK_AMP_MIN = 14
const PEAK_AMP_MAX = 48
const PEAK_SPREAD_MIN = 0.06
const PEAK_SPREAD_MAX = 0.20

export function buildLandscapePeaks(seed: number): LandscapePeak[] {
  const rand = mulberry32(seed)
  const peaks: LandscapePeak[] = []

  for (let i = 0; i < PEAK_COUNT; i++) {
    const x = 0.08 + rand() * 0.84
    const z = 0.12 + rand() * 0.76
    const amp = PEAK_AMP_MIN + rand() * (PEAK_AMP_MAX - PEAK_AMP_MIN)
    const spread = PEAK_SPREAD_MIN + rand() * (PEAK_SPREAD_MAX - PEAK_SPREAD_MIN)
    peaks.push({ x, z, amp, spread })

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

  const hillockCount = 8 + Math.floor(rand() * 6)
  for (let i = 0; i < hillockCount; i++) {
    peaks.push({
      x: 0.03 + rand() * 0.94,
      z: 0.03 + rand() * 0.94,
      amp: 2 + rand() * 7,
      spread: 0.04 + rand() * 0.10,
    })
  }

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
   Landscape Constants
   ═══════════════════════════════════════════════════════════════════════════ */

const RIDGE_HEIGHT = 40
const RIDGE_WIDTH = 0.18

const HEIGHT_SCALE = 1.2

/* ═══════════════════════════════════════════════════════════════════════════
   generateLandscapeHeight — Pure procedural height at normalized (nx, nz)

   nx, nz ∈ [0, 1] — normalized coordinates across the terrain plane.
   seed   — deterministic seed integer.
   peaks  — pre-computed from buildLandscapePeaks(seed). Pass in to avoid
            re-deriving per vertex.

   Returns: height value (unscaled by terrain constants).
   ═══════════════════════════════════════════════════════════════════════════ */

export function generateLandscapeHeight(
  nx: number,
  nz: number,
  seed: number,
  peaks: LandscapePeak[],
): number {
  // Main spine ridge running along X near Z = 0.5 with gentle wander
  const ridgeCenter = 0.5 + Math.sin(nx * Math.PI * 2.5 + seed * 0.07) * 0.06
  const ridgeDist = nz - ridgeCenter
  const ridgeProfile = Math.exp(
    -(ridgeDist * ridgeDist) / (RIDGE_WIDTH * RIDGE_WIDTH),
  )
  const ridgeUndulation = 0.55 + 0.45 * Math.sin(nx * Math.PI * 3.0 + seed * 0.13)
  const ridge = RIDGE_HEIGHT * ridgeProfile * ridgeUndulation

  // Secondary spur ridges branching from the spine
  const spur1Dist = nz - (0.35 + Math.sin(nx * Math.PI * 4 + seed * 1.3) * 0.05)
  const spur1 = 8 * Math.exp(-(spur1Dist * spur1Dist) / 0.025) *
    smoothstep(0.2, 0.45, nx) * smoothstep(0.8, 0.55, nx)
  const spur2Dist = nz - (0.65 + Math.cos(nx * Math.PI * 3.5 + seed * 0.9) * 0.04)
  const spur2 = 6 * Math.exp(-(spur2Dist * spur2Dist) / 0.02) *
    smoothstep(0.3, 0.55, nx) * smoothstep(0.9, 0.65, nx)

  // Seed-driven Gaussian peaks with natural overlap
  let peakContrib = 0
  for (const p of peaks) {
    const dx = nx - p.x
    const dz = nz - p.z
    const d2 = (dx * dx + dz * dz) / (p.spread * p.spread)
    peakContrib += p.amp * Math.exp(-d2)
  }

  // Ridged noise (4 octaves) — craggy ridgeline features
  const ridgedDetail = ridgedNoise(nx * 5, nz * 5, seed + 7, 4) * 6.0

  // FBM noise (5 octaves) — general terrain texture
  const detailNoise = fbmNoise(nx * 7, nz * 7, seed, 5) * 4.0

  // Micro noise (3 octaves FBM at 16x frequency) — fine surface detail
  const microNoise = fbmNoise(nx * 16, nz * 16, seed + 37, 3) * 1.5

  // Broad terrain undulation — wide dramatic valleys and rises
  const broadWave =
    Math.sin(nx * Math.PI * 1.3 + seed * 0.02) * 5.8 +
    Math.cos(nz * Math.PI * 1.8 - seed * 0.015) * 4.5

  // Edge falloff — gradual taper so terrain blends into background
  const edgeFade = Math.min(
    smoothstep(0, 0.22, nx),
    smoothstep(1, 0.78, nx),
    smoothstep(0, 0.16, nz),
    smoothstep(1, 0.84, nz),
  )

  const raw = ridge + spur1 + spur2 + peakContrib + ridgedDetail + detailNoise + microNoise + broadWave
  return (raw * edgeFade - 2.0) * HEIGHT_SCALE
}

/* ═══════════════════════════════════════════════════════════════════════════
   Heightfield Stabilization Pipeline
   Operates on a flat Float32Array of vertex heights BEFORE mesh generation.
   ═══════════════════════════════════════════════════════════════════════════ */

const MAX_SLOPE = 0.55
const SLOPE_CLAMP_PASSES = 3
const BROAD_SMOOTH_PASSES = 2
const BROAD_SMOOTH_STRENGTH = 0.13
const DETAIL_SMOOTH_PASSES = 1
const DETAIL_SMOOTH_THRESHOLD = 1.6
const PEAK_ROUND_THRESHOLD = 1.6
const PEAK_ROUND_STRENGTH = 0.3

export function stabilizeHeightfield(hf: Float32Array, vpr: number): void {
  const count = hf.length

  for (let pass = 0; pass < SLOPE_CLAMP_PASSES; pass++) {
    let violations = 0

    for (let row = 0; row < vpr; row++) {
      for (let col = 0; col < vpr; col++) {
        const i = row * vpr + col
        if (col > 0) {
          const left = hf[i - 1]
          const diff = hf[i] - left
          if (Math.abs(diff) > MAX_SLOPE) { hf[i] = left + Math.sign(diff) * MAX_SLOPE; violations++ }
        }
        if (row > 0) {
          const above = hf[i - vpr]
          const diff = hf[i] - above
          if (Math.abs(diff) > MAX_SLOPE) { hf[i] = above + Math.sign(diff) * MAX_SLOPE; violations++ }
        }
      }
    }

    for (let row = vpr - 1; row >= 0; row--) {
      for (let col = vpr - 1; col >= 0; col--) {
        const i = row * vpr + col
        if (col < vpr - 1) {
          const right = hf[i + 1]
          const diff = hf[i] - right
          if (Math.abs(diff) > MAX_SLOPE) { hf[i] = right + Math.sign(diff) * MAX_SLOPE; violations++ }
        }
        if (row < vpr - 1) {
          const below = hf[i + vpr]
          const diff = hf[i] - below
          if (Math.abs(diff) > MAX_SLOPE) { hf[i] = below + Math.sign(diff) * MAX_SLOPE; violations++ }
        }
      }
    }

    for (let row = 1; row < vpr - 1; row++) {
      for (let col = 1; col < vpr - 1; col++) {
        const i = row * vpr + col
        const diag = MAX_SLOPE * 1.414
        const corners = [i - vpr - 1, i - vpr + 1, i + vpr - 1, i + vpr + 1]
        for (const ni of corners) {
          const diff = hf[i] - hf[ni]
          if (Math.abs(diff) > diag) { hf[i] = hf[ni] + Math.sign(diff) * diag; violations++ }
        }
      }
    }

    if (violations === 0) break
  }

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

  for (let pass = 0; pass < DETAIL_SMOOTH_PASSES; pass++) {
    tmp.set(hf)
    for (let row = 1; row < vpr - 1; row++) {
      for (let col = 1; col < vpr - 1; col++) {
        const i = row * vpr + col
        const c = tmp[i]
        const avg4 = (tmp[i - 1] + tmp[i + 1] + tmp[i - vpr] + tmp[i + vpr]) * 0.25
        const curvature = Math.abs(c - avg4)
        const s = curvature > DETAIL_SMOOTH_THRESHOLD ? 0.35 : curvature > 0.4 ? 0.12 : 0.02
        hf[i] = c * (1 - s) + avg4 * s
      }
    }
  }

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
      if (excessAbove > PEAK_ROUND_THRESHOLD || excessBelow > PEAK_ROUND_THRESHOLD) {
        hf[i] = c * (1 - PEAK_ROUND_STRENGTH) + nAvg * PEAK_ROUND_STRENGTH
      }
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   buildLandscapeHeightfield — Generates a complete heightfield array.

   Returns a Float32Array of (segments+1)^2 heights, stabilized and ready
   for direct mesh application.
   ═══════════════════════════════════════════════════════════════════════════ */

export function buildLandscapeHeightfield(
  seed: number,
  segments: number,
): Float32Array {
  const vpr = segments + 1
  const count = vpr * vpr
  const hf = new Float32Array(count)
  const peaks = buildLandscapePeaks(seed)

  for (let row = 0; row < vpr; row++) {
    for (let col = 0; col < vpr; col++) {
      const i = row * vpr + col
      const nx = col / segments
      const nz = row / segments
      hf[i] = generateLandscapeHeight(nx, nz, seed, peaks)
    }
  }

  stabilizeHeightfield(hf, vpr)

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
   sampleLandscapeHeight — Point query for markers, paths, etc.
   ═══════════════════════════════════════════════════════════════════════════ */

export function sampleLandscapeHeight(
  worldX: number,
  worldZ: number,
  seed: number,
  width: number,
  depth: number,
): number {
  const nx = (worldX + width * 0.5) / width
  const nz = (worldZ + depth * 0.5) / depth
  const peaks = buildLandscapePeaks(seed)
  return generateLandscapeHeight(
    Math.max(0, Math.min(1, nx)),
    Math.max(0, Math.min(1, nz)),
    seed,
    peaks,
  )
}
