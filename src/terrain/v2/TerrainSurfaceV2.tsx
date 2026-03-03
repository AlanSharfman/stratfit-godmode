import * as THREE from "three"
import { useMemo, useEffect } from "react"

// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — TerrainSurfaceV2  (Cinematic Layered Terrain)
//
// 5-layer procedural heightfield:
//   1. Base elevation curve   (low-freq FBM)
//   2. Ridge noise            (ridged multi-fractal)
//   3. Valley shaping pass    (signed FBM, negative-biased)
//   4. Micro terrain detail   (high-freq FBM)
//   5. Gaussian smoothing     (grid-space kernel, peak-softness-driven)
//
// Material: height + slope–aware MeshStandardMaterial (onBeforeCompile).
// No external deps. No global state. Deterministic.
// ═══════════════════════════════════════════════════════════════════════════

// ─── Tuning Parameter Contract (re-exported from shared) ───────────────────
export type { TerrainTuningParams } from "@/terrain/terrainTuning"
export { DEFAULT_TUNING } from "@/terrain/terrainTuning"
import type { TerrainTuningParams } from "@/terrain/terrainTuning"
import { DEFAULT_TUNING } from "@/terrain/terrainTuning"

// ─── Procedural Noise (zero-dependency) ────────────────────────────────────

/** Sin-hash producing pseudo-random value in [-1, 1] for integer coords. */
function hash2D(ix: number, iy: number): number {
  const n = Math.sin(ix * 127.1 + iy * 311.7) * 43758.5453123
  return (n - Math.floor(n)) * 2 - 1
}

/** Offset hash for decorrelated layers. */
function hash2DOffset(
  ix: number,
  iy: number,
  ox: number,
  oy: number,
): number {
  const n =
    Math.sin((ix + ox) * 157.3 + (iy + oy) * 269.5) * 43758.5453123
  return (n - Math.floor(n)) * 2 - 1
}

/** Quintic (C2) interpolation — eliminates derivative discontinuities. */
function quintic(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/** Bilinear value noise with quintic interpolation. */
function valueNoise(x: number, y: number): number {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = quintic(x - ix)
  const fy = quintic(y - iy)

  const n00 = hash2D(ix, iy)
  const n10 = hash2D(ix + 1, iy)
  const n01 = hash2D(ix, iy + 1)
  const n11 = hash2D(ix + 1, iy + 1)

  const nx0 = n00 + (n10 - n00) * fx
  const nx1 = n01 + (n11 - n01) * fx
  return nx0 + (nx1 - nx0) * fy
}

/** Decorrelated value noise using offset hashes. */
function valueNoiseOffset(
  x: number,
  y: number,
  ox: number,
  oy: number,
): number {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = quintic(x - ix)
  const fy = quintic(y - iy)

  const n00 = hash2DOffset(ix, iy, ox, oy)
  const n10 = hash2DOffset(ix + 1, iy, ox, oy)
  const n01 = hash2DOffset(ix, iy + 1, ox, oy)
  const n11 = hash2DOffset(ix + 1, iy + 1, ox, oy)

  const nx0 = n00 + (n10 - n00) * fx
  const nx1 = n01 + (n11 - n01) * fx
  return nx0 + (nx1 - nx0) * fy
}

/**
 * Fractional Brownian Motion — standard multi-octave noise.
 * Returns value roughly in [-1, 1].
 */
function fbm(
  x: number,
  y: number,
  octaves: number,
  frequency: number,
  persistence: number,
  lacunarity: number = 2.0,
): number {
  let value = 0
  let amplitude = 1
  let maxAmp = 0
  for (let i = 0; i < octaves; i++) {
    value += valueNoise(x * frequency, y * frequency) * amplitude
    maxAmp += amplitude
    amplitude *= persistence
    frequency *= lacunarity
  }
  return value / maxAmp
}

/**
 * Ridged multi-fractal — creates sharp ridge / mountain-spine shapes.
 * The abs(noise) inversion produces sharp creases; squaring adds weight.
 */
function ridgedFBM(
  x: number,
  y: number,
  octaves: number,
  frequency: number,
  persistence: number,
  lacunarity: number = 2.0,
): number {
  let value = 0
  let amplitude = 1
  let maxAmp = 0
  let prev = 1.0
  for (let i = 0; i < octaves; i++) {
    const n = Math.abs(
      valueNoiseOffset(x * frequency, y * frequency, 73, 137),
    )
    const ridge = 1 - n
    const weighted = ridge * ridge * prev
    value += weighted * amplitude
    maxAmp += amplitude
    prev = ridge
    amplitude *= persistence
    frequency *= lacunarity
  }
  return value / maxAmp
}

// ─── Terrain Height Function (5-layer model) ──────────────────────────────

function computeTerrainHeight(
  x: number,
  z: number,
  p: TerrainTuningParams,
): number {
  const freq = p.noiseFrequency

  // ── Layer 1: Base elevation curve ──
  // Low-frequency FBM creating broad gentle hills and depressions.
  const base =
    fbm(x * 0.0025 * freq, z * 0.003 * freq, 4, 1.0, 0.5) *
    14 *
    p.elevationScale

  // ── Layer 2: Ridge noise ──
  // Ridged multi-fractal at low frequency → sharp ridge / spine lines.
  const ridge =
    ridgedFBM(x * 0.005 * freq, z * 0.005 * freq, 4, 1.0, 0.42) *
    12 *
    p.ridgeIntensity *
    p.elevationScale

  // ── Layer 3: Valley shaping pass ──
  // Signed FBM; negative areas are amplified to carve valleys,
  // positive areas contribute moderate lift.
  const valleyRaw = fbm(
    x * 0.004 * freq + 31.7,
    z * 0.004 * freq + 47.3,
    3,
    1.0,
    0.55,
  )
  const valley =
    valleyRaw < 0
      ? valleyRaw * p.valleyDepth * 10
      : valleyRaw * 3 * p.elevationScale

  // ── Layer 4: Micro terrain detail ──
  // High-frequency, low-amplitude noise for surface texture.
  const micro =
    fbm(
      x * 0.018 * freq + 97.1,
      z * 0.02 * freq + 113.5,
      2,
      1.0,
      0.5,
    ) *
    2.0 *
    p.microDetailStrength

  // ── Combine layers ──
  let h = base + ridge + valley + micro

  // Roughness modulates overall amplitude variance
  h *= 0.5 + p.terrainRoughness * 0.5

  // Peak softness — power-curve compression on positive heights
  if (h > 0) {
    const ceiling = 35 * Math.max(0.3, p.elevationScale)
    const normalized = Math.min(1, h / ceiling)
    const softened = Math.pow(normalized, 1.0 + p.peakSoftness * 0.6)
    h = softened * ceiling
  }

  // Domain warp — subtle coordinate distortion for organic feel
  const warpX = valueNoiseOffset(x * 0.008, z * 0.012, 200, 300) * 6
  const warpZ = valueNoiseOffset(x * 0.012, z * 0.008, 400, 500) * 6
  const warpContrib =
    fbm(
      (x + warpX) * 0.005 * freq,
      (z + warpZ) * 0.005 * freq,
      2,
      1.0,
      0.5,
    ) *
    3 *
    p.elevationScale
  h += warpContrib * 0.3

  // Edge falloff — smooth fade so boundaries don't read as clipped
  const halfSize = 190
  const edgeMargin = 0.15
  const edgeX = smoothFade(
    Math.abs(x),
    halfSize * (1 - edgeMargin),
    halfSize,
  )
  const edgeZ = smoothFade(
    Math.abs(z),
    halfSize * (1 - edgeMargin),
    halfSize,
  )
  h *= (1 - edgeX) * (1 - edgeZ)

  return h
}

/** Hermite smoothstep transition used for edge falloff. */
function smoothFade(value: number, edge0: number, edge1: number): number {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

// ─── Grid-space Gaussian Smoothing ─────────────────────────────────────────

/**
 * In-place weighted-average smooth over a vertex grid.
 * Uses 8-neighbour kernel (cardinal + diagonal) with configurable pass count.
 * This is Layer 5 — removes noise spikiness while preserving broad shape.
 */
function gaussianSmoothGrid(
  posAttr: THREE.BufferAttribute,
  widthSegs: number,
  heightSegs: number,
  passes: number,
): void {
  const cols = widthSegs + 1
  const rows = heightSegs + 1

  // Extract current Y (height) values
  let heights = new Float32Array(posAttr.count)
  for (let i = 0; i < posAttr.count; i++) {
    heights[i] = posAttr.getY(i)
  }

  for (let p = 0; p < passes; p++) {
    const next = new Float32Array(heights.length)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c
        let sum = heights[idx] * 4
        let weight = 4

        // Cardinal neighbours
        if (c > 0) {
          sum += heights[idx - 1]
          weight += 1
        }
        if (c < cols - 1) {
          sum += heights[idx + 1]
          weight += 1
        }
        if (r > 0) {
          sum += heights[idx - cols]
          weight += 1
        }
        if (r < rows - 1) {
          sum += heights[idx + cols]
          weight += 1
        }

        // Diagonal neighbours (half weight)
        if (c > 0 && r > 0) {
          sum += heights[idx - cols - 1] * 0.5
          weight += 0.5
        }
        if (c < cols - 1 && r > 0) {
          sum += heights[idx - cols + 1] * 0.5
          weight += 0.5
        }
        if (c > 0 && r < rows - 1) {
          sum += heights[idx + cols - 1] * 0.5
          weight += 0.5
        }
        if (c < cols - 1 && r < rows - 1) {
          sum += heights[idx + cols + 1] * 0.5
          weight += 0.5
        }

        next[idx] = sum / weight
      }
    }
    heights = next
  }

  // Write smoothed values back
  for (let i = 0; i < posAttr.count; i++) {
    posAttr.setY(i, heights[i])
  }
}

// ─── Cinematic Height-Aware Material ───────────────────────────────────────

function createCinematicTerrainMaterial(): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0e1e34,
    roughness: 0.72,
    metalness: 0.18,
    flatShading: false,
  })

  mat.onBeforeCompile = (shader) => {
    // ── Vertex: pass height + world-normal to fragment ──
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
varying float vElevation;
varying vec3 vWorldNormal;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vElevation = position.y;
vWorldNormal = normalize(normalMatrix * normal);`,
      )

    // ── Fragment: height + slope → cinematic colour ──
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying float vElevation;
varying vec3 vWorldNormal;`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>

// ── Cinematic terrain colouring ──
float hNorm = clamp((vElevation + 4.0) / 30.0, 0.0, 1.0);

// 3-stop colour ramp: valley → mid shelf → peak
vec3 valleyCol = vec3(0.020, 0.043, 0.082);
vec3 midCol    = vec3(0.055, 0.118, 0.204);
vec3 peakCol   = vec3(0.098, 0.216, 0.318);

vec3 terrainCol = mix(valleyCol, midCol, smoothstep(0.0, 0.35, hNorm));
terrainCol      = mix(terrainCol, peakCol, smoothstep(0.35, 0.82, hNorm));

// Slope darkening — steeper faces recede
float slope = 1.0 - abs(vWorldNormal.y);
terrainCol *= mix(0.82, 1.0, 1.0 - slope * 0.55);

// Ridge highlight — subtle warm-teal accent at peaks
terrainCol += vec3(0.008, 0.018, 0.038) * smoothstep(0.72, 1.0, hNorm);

// Valley ambient occlusion — darken the bottoms
float ao = smoothstep(-0.05, 0.30, hNorm);
terrainCol *= mix(0.58, 1.0, ao);

// Gentle emissive glow on upper regions
terrainCol += vec3(0.004, 0.010, 0.020) * hNorm;

diffuseColor.rgb = terrainCol;`,
      )
  }

  return mat
}

// ─── Component ─────────────────────────────────────────────────────────────

type Props = {
  granularity: string | number
  tuning?: TerrainTuningParams
}

export default function TerrainSurfaceV2({
  granularity,
  tuning = DEFAULT_TUNING,
}: Props) {
  // ── Build geometry (recomputed when tuning changes) ──
  const geometry = useMemo(() => {
    const size = 380
    const segments = 280
    const geo = new THREE.PlaneGeometry(size, size, segments, segments)
    geo.rotateX(-Math.PI / 2)

    const pos = geo.attributes.position as THREE.BufferAttribute

    // Compute heights using the 5-layer model (layers 1–4)
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      pos.setY(i, computeTerrainHeight(x, z, tuning))
    }

    // Layer 5: Gaussian smoothing — pass count driven by peakSoftness
    const smoothPasses = Math.max(1, Math.round(tuning.peakSoftness * 4))
    gaussianSmoothGrid(pos, segments, segments, smoothPasses)

    pos.needsUpdate = true
    geo.computeVertexNormals()
    return geo
  }, [granularity, tuning])

  // Dispose previous geometry on swap
  useEffect(() => () => { geometry.dispose() }, [geometry])

  // Material — compile-once, height shader is data-driven
  const material = useMemo(() => createCinematicTerrainMaterial(), [])
  useEffect(() => () => { material.dispose() }, [material])

  return (
    <mesh geometry={geometry} receiveShadow>
      <primitive object={material} attach="material" />
    </mesh>
  )
}
