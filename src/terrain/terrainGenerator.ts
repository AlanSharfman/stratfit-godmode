import { Noise } from 'noisejs'

const noise = new Noise(42)

export interface TerrainInputs {
  x: number
  z: number
  time: number
  modifier?: number
}

export function generateTerrainHeight({
  x,
  z,
  time,
  modifier = 0
}: TerrainInputs): number {

  const scale = 0.015

  const base =
    noise.perlin2(x * scale, z * scale) * 12 +
    noise.perlin2(x * scale * 0.5, z * scale * 0.5) * 8

  const delta = modifier * Math.sin(time * 0.02)

  return base + delta
}

