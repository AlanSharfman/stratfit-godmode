import * as THREE from "three"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"
import { GOD } from "@/terrain/godModeColors"

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
  const glowRef = useRef<THREE.Mesh>(null)

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

  const geos = useMemo(() => {
    if (points.length < 2) return null
    const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.35)

    const coreGeo = new THREE.TubeGeometry(curve, 320, 0.09, 10, false)
    const glowGeo = new THREE.TubeGeometry(curve, 320, 0.15, 10, false)

    return { coreGeo, glowGeo }
  }, [points])

  const coreMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(GOD.pathCore),
      emissive: new THREE.Color(GOD.pathEnergy),
      emissiveIntensity: 4.0,
      roughness: 0.2,
      metalness: 0.0,
    })
  }, [])

  const glowMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(GOD.pathHalo),
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  }, [])

  useEffect(() => {
    return () => {
      geos?.coreGeo.dispose()
      geos?.glowGeo.dispose()
      coreMat.dispose()
      glowMat.dispose()
    }
  }, [geos, coreMat, glowMat])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (!glowRef.current) return
    const mat = glowRef.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.18 + Math.sin(t * 0.8) * 0.03
  })

  if (!geos) return null

  return (
    <group>
      {/* Core */}
      <mesh geometry={geos.coreGeo} material={coreMat} renderOrder={50} />

      {/* Glow */}
      <mesh
        ref={glowRef}
        geometry={geos.glowGeo}
        material={glowMat}
        renderOrder={51}
      />
    </group>
  )
}
