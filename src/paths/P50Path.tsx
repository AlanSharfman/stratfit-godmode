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

export default function P50Path({ terrainRef, hoverOffset = 0.68, rebuildKey }: Props) {
  const [points, setPoints] = useState<THREE.Vector3[]>([])

  const x0 = useMemo(() => -TERRAIN_CONSTANTS.width * 0.36, [])
  const x1 = useMemo(() => TERRAIN_CONSTANTS.width * 0.36, [])

  useEffect(() => {
    const terrain = terrainRef.current
    if (!terrain) return

    const next: THREE.Vector3[] = []
    const count = 240

    // Deterministic meander (no data-dependent noise)
    const amp1 = 22
    const amp2 = 9
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
    <Line
      points={points}
      color="#00E0FF"
      lineWidth={3}
      transparent
      opacity={0.92}
    />
  )
}
