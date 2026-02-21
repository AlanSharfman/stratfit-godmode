import { Line } from "@react-three/drei"
import * as THREE from "three"
import React, { useEffect, useMemo, useState } from "react"
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"

type Props = {
  terrainRef: React.RefObject<TerrainSurfaceHandle>
  hoverOffset?: number
  rebuildKey?: string
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

/**
 * P50Path — Brilliant glowing icy-white/cyan neon trajectory.
 * Flows organically over the terrain, hugging contours with gravity and momentum.
 * Two passes: outer glow (wider, softer) + inner core (bright, sharp).
 */
export default function P50Path({ terrainRef, hoverOffset = 0.20, rebuildKey }: Props) {
  const [points, setPoints] = useState<THREE.Vector3[]>([])

  const x0 = useMemo(() => -TERRAIN_CONSTANTS.width * 0.46, [])
  const x1 = useMemo(() => TERRAIN_CONSTANTS.width * 0.46, [])

  useEffect(() => {
    const terrain = terrainRef.current
    if (!terrain) return

    const next: THREE.Vector3[] = []
    const count = 320 // Higher density for smoother S-curves

    // Organic meander — wider, more dramatic curves
    const amp1 = 28
    const amp2 = 12
    const w1 = Math.PI * 2 * 1.05
    const w2 = Math.PI * 2 * 2.35
    const p1 = 0.75
    const p2 = 1.9

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1)
      const x = lerp(x0, x1, t)
      const z = Math.sin(t * w1 + p1) * amp1 + Math.sin(t * w2 + p2) * amp2
      const y = terrain.getHeightAt(x, z) + hoverOffset
      next.push(new THREE.Vector3(x, y, z))
    }

    setPoints(next)
  }, [terrainRef, x0, x1, hoverOffset, rebuildKey])

  if (points.length < 2) return null

  return (
    <group>
      {/* Outer glow pass — wider, softer azure */}
      <Line
        points={points}
        color="#2979FF"
        lineWidth={6.3}
        transparent
        opacity={0.45}
      />
      {/* Inner core — bright neon azure */}
      <Line
        points={points}
        color="#82B1FF"
        lineWidth={2.625}
        transparent
        opacity={1.0}
      />
    </group>
  )
}
