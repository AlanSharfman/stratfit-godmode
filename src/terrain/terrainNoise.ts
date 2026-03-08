// src/terrain/terrainNoise.ts
// Deterministic noise and math utilities for terrain generation.

export function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

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
