// src/terrain/terrainGenerator.ts
// STRATFIT — Geological Terrain Generator v2
// Ridged multifractal + domain warping + erosion

import { createNoise2D, NoiseFunction2D } from 'simplex-noise'

// ═══════════════════════════════════════════════════════════════════════════════
// SEEDED PRNG (deterministic across sessions)
// ═══════════════════════════════════════════════════════════════════════════════

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Multiple noise instances for layering
const prng1 = mulberry32(12345)
const prng2 = mulberry32(67890)
const prng3 = mulberry32(11111)
const prng4 = mulberry32(22222)

const noise1: NoiseFunction2D = createNoise2D(prng1)
const noise2: NoiseFunction2D = createNoise2D(prng2)
const noise3: NoiseFunction2D = createNoise2D(prng3)
const noiseWarp: NoiseFunction2D = createNoise2D(prng4)

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Domain warping (makes terrain flow naturally)
  warpStrength: 25,
  warpFrequency: 0.008,

  // Ridged noise layers
  ridgeFrequency: 0.012,
  ridgeOctaves: 5,
  ridgeLacunarity: 2.1, // Frequency multiplier per octave
  ridgePersistence: 0.5, // Amplitude multiplier per octave
  ridgeSharpness: 2.0, // Higher = sharper ridges

  // Base terrain shape
  baseFrequency: 0.006,
  baseAmplitude: 0.4,

  // Mountain envelope (controls overall shape)
  peakX: 0,
  peakZ: 0,
  peakRadius: 100,
  peakFalloffPower: 1.5, // Higher = steeper falloff

  // Erosion channels
  erosionFrequency: 0.025,
  erosionDepth: 0.3,
  erosionThreshold: 0.3, // Only erode below this relative height

  // Altitude-based detail
  highAltitudeRoughness: 1.4, // More jagged peaks
  lowAltitudeSmoothing: 0.6, // Smoother valleys

  // Plateau/cliff features
  plateauLevels: [0.3, 0.6, 0.85], // Height thresholds for terracing
  plateauStrength: 0.15, // How pronounced the terracing is
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORE NOISE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Ridged multifractal noise
 * Creates sharp ridge lines instead of smooth hills
 */
function ridgedNoise(x: number, z: number, frequency: number): number {
  let sum = 0
  let amplitude = 1
  let maxAmplitude = 0
  let freq = frequency

  for (let i = 0; i < CONFIG.ridgeOctaves; i++) {
    // Get noise value and make it ridged
    let n = noise1(x * freq, z * freq)

    // Convert to ridged: take absolute value and invert
    n = 1 - Math.abs(n)

    // Sharpen the ridges
    n = Math.pow(n, CONFIG.ridgeSharpness)

    sum += n * amplitude
    maxAmplitude += amplitude

    amplitude *= CONFIG.ridgePersistence
    freq *= CONFIG.ridgeLacunarity
  }

  return sum / maxAmplitude
}

/**
 * Domain warping
 * Offsets coordinates based on another noise field
 * Creates natural, flowing distortion
 */
function warpedCoords(
  x: number,
  z: number
): { wx: number; wz: number } {
  const warpX = noiseWarp(x * CONFIG.warpFrequency, z * CONFIG.warpFrequency)
  const warpZ = noiseWarp(
    x * CONFIG.warpFrequency + 100,
    z * CONFIG.warpFrequency + 100
  )

  return {
    wx: x + warpX * CONFIG.warpStrength,
    wz: z + warpZ * CONFIG.warpStrength,
  }
}

/**
 * Smooth base terrain layer
 * Large-scale rolling hills
 */
function baseTerrainNoise(x: number, z: number): number {
  const n1 = noise2(x * CONFIG.baseFrequency, z * CONFIG.baseFrequency)
  const n2 = noise2(
    x * CONFIG.baseFrequency * 2.3 + 50,
    z * CONFIG.baseFrequency * 2.3 + 50
  )
  return (n1 + n2 * 0.5) / 1.5
}

/**
 * Erosion channels
 * Carves valleys into lower areas
 */
function erosionMask(x: number, z: number, currentHeight: number): number {
  if (currentHeight > CONFIG.erosionThreshold) {
    return 0 // No erosion on high ground
  }

  const erosionNoise = noise3(
    x * CONFIG.erosionFrequency,
    z * CONFIG.erosionFrequency
  )

  // Create channel-like patterns
  const channel = Math.pow(Math.abs(erosionNoise), 0.5)

  // Stronger erosion at lower altitudes
  const altitudeFactor = 1 - currentHeight / CONFIG.erosionThreshold

  return channel * CONFIG.erosionDepth * altitudeFactor
}

/**
 * Plateau/terracing effect
 * Creates natural cliff bands at certain altitudes
 */
function applyPlateaus(height: number): number {
  let h = height

  for (const level of CONFIG.plateauLevels) {
    const dist = Math.abs(h - level)
    if (dist < 0.1) {
      // Snap toward plateau level
      const snapStrength = (0.1 - dist) / 0.1
      h = h + (level - h) * snapStrength * CONFIG.plateauStrength
    }
  }

  return h
}

/**
 * Mountain envelope
 * Controls the overall silhouette
 */
function mountainEnvelope(x: number, z: number): number {
  const dx = x - CONFIG.peakX
  const dz = z - CONFIG.peakZ
  const dist = Math.sqrt(dx * dx + dz * dz)

  // Smooth falloff from center
  const normalizedDist = dist / CONFIG.peakRadius
  const falloff = Math.max(0, 1 - Math.pow(normalizedDist, CONFIG.peakFalloffPower))

  return falloff
}

/**
 * Altitude-based detail modifier
 * More roughness at peaks, smoother in valleys
 */
function altitudeDetailMod(baseHeight: number): number {
  if (baseHeight > 0.7) {
    return CONFIG.highAltitudeRoughness
  } else if (baseHeight < 0.3) {
    return CONFIG.lowAltitudeSmoothing
  }
  // Lerp between
  const t = (baseHeight - 0.3) / 0.4
  return CONFIG.lowAltitudeSmoothing +
    t * (CONFIG.highAltitudeRoughness - CONFIG.lowAltitudeSmoothing)
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCENARIO MODIFIERS
// Maps business metrics to terrain characteristics
// ═══════════════════════════════════════════════════════════════════════════════

interface ScenarioParams {
  // These come from your Monte Carlo simulation results
  health: number // 0-1: Overall business health → peak height
  volatility: number // 0-1: Risk/variance → terrain roughness
  momentum: number // -1 to 1: Growth trend → ridge direction bias
  resilience: number // 0-1: Stability → plateau strength
}

const DEFAULT_SCENARIO: ScenarioParams = {
  health: 0.7,
  volatility: 0.5,
  momentum: 0.2,
  resilience: 0.6,
}

function applyScenarioModifiers(
  baseHeight: number,
  x: number,
  z: number,
  scenario: ScenarioParams
): number {
  let h = baseHeight

  // Health affects overall altitude
  h *= 0.5 + scenario.health * 0.8

  // Volatility adds micro-roughness
  if (scenario.volatility > 0.3) {
    const roughness = noise3(x * 0.08, z * 0.08)
    h += roughness * (scenario.volatility - 0.3) * 0.3
  }

  // Momentum biases ridge direction (subtle tilt)
  h += scenario.momentum * 0.1 * (z / CONFIG.peakRadius)

  // Resilience affects plateau definition
  if (scenario.resilience > 0.5) {
    h = applyPlateaus(h)
  }

  return h
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

export interface TerrainParams {
  x: number
  z: number
  time?: number
  modifier?: number // 0 = baseline, 1+ = exploration scenarios
  scenario?: Partial<ScenarioParams>
}

let sanityLogged = false

export function generateTerrainHeight(params: TerrainParams): number {
  const { x, z, time = 0, modifier = 0, scenario = {} } = params

  // Merge with defaults
  const scenarioParams: ScenarioParams = {
    ...DEFAULT_SCENARIO,
    ...scenario,
  }

  // Offset for different scenarios (creates different but related terrain)
  const scenarioOffset = modifier * 50

  // Step 1: Warp the domain for natural flow
  const { wx, wz } = warpedCoords(x + scenarioOffset, z)

  // Step 2: Get mountain envelope (overall shape)
  const envelope = mountainEnvelope(x, z)

  // Step 3: Build base terrain
  const base = baseTerrainNoise(wx, wz) * CONFIG.baseAmplitude

  // Step 4: Add ridged detail
  const ridged = ridgedNoise(wx, wz, CONFIG.ridgeFrequency)

  // Step 5: Combine base and ridged
  // Ridged noise is more prominent near peaks
  const ridgeMix = envelope * 0.7 + 0.3
  let height = base * (1 - ridgeMix) + ridged * ridgeMix

  // Step 6: Apply mountain envelope
  height *= envelope

  // Step 7: Altitude-based detail
  const detailMod = altitudeDetailMod(height)
  const microDetail = noise3(wx * 0.05, wz * 0.05) * 0.1 * detailMod
  height += microDetail

  // Step 8: Erosion channels in valleys
  const erosion = erosionMask(wx, wz, height)
  height -= erosion

  // Step 9: Apply scenario modifiers
  height = applyScenarioModifiers(height, x, z, scenarioParams)

  // Step 10: Subtle time animation (optional)
  if (time > 0) {
    const timeWave = Math.sin(time * 0.5 + x * 0.02) * 0.02
    height += timeWave * envelope
  }

  // Sanity check (once)
  if (!sanityLogged) {
    sanityLogged = true
    console.log('[terrainGenerator v2] Geological generator loaded')
    console.log('  Sample heights:', {
      center: generateTerrainHeightInternal(0, 0, scenarioParams).toFixed(3),
      edge: generateTerrainHeightInternal(80, 80, scenarioParams).toFixed(3),
      corner: generateTerrainHeightInternal(-100, -100, scenarioParams).toFixed(3),
    })
  }

  return Number.isFinite(height) ? height : 0
}

// Internal version without logging (for sanity check)
function generateTerrainHeightInternal(
  x: number,
  z: number,
  scenario: ScenarioParams
): number {
  const { wx, wz } = warpedCoords(x, z)
  const envelope = mountainEnvelope(x, z)
  const base = baseTerrainNoise(wx, wz) * CONFIG.baseAmplitude
  const ridged = ridgedNoise(wx, wz, CONFIG.ridgeFrequency)
  const ridgeMix = envelope * 0.7 + 0.3
  let height = base * (1 - ridgeMix) + ridged * ridgeMix
  height *= envelope
  height = applyScenarioModifiers(height, x, z, scenario)
  return height
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default generateTerrainHeight

// Export config for tuning UI (optional)
export { CONFIG as TERRAIN_CONFIG }
export type { ScenarioParams }
