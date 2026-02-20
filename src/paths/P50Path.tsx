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
  const [pathCurve, setPathCurve] = useState<THREE.CatmullRomCurve3 | null>(null)

  const x0 = useMemo(() => -TERRAIN_CONSTANTS.width * 0.36, [])
  const x1 = useMemo(() => TERRAIN_CONSTANTS.width * 0.36, [])

  useEffect(() => {
    const terrain = terrainRef.current
    if (!terrain) return

    const pts: THREE.Vector3[] = []
    const count = 240

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
      pts.push(new THREE.Vector3(x, y, z))
    }

    setPathCurve(new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5))
  }, [terrainRef, x0, x1, hoverOffset, rebuildKey])

  if (!pathCurve) return null

  return (
    <mesh castShadow>
      <tubeGeometry args={[pathCurve, 512, 0.45, 8, false]} />
      <meshStandardMaterial
        color="#E0FFFF"
        emissive="#00E0FF"
        emissiveIntensity={4.5}
        toneMapped={false}
      />
    </mesh>
  )
}
