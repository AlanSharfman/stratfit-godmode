// src/terrain/HealthRidgePath.tsx
// Color-coded contour path following the terrain midline through revealed zones.

import React, { memo, useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, KPI_ZONE_MAP, getHealthLevel, getHealthColor } from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import type { ProgressiveTerrainHandle } from "./ProgressiveTerrainSurface"

interface Props {
  terrainRef: React.RefObject<ProgressiveTerrainHandle>
  revealedKpis: Set<KpiKey>
  kpis: PositionKpis | null
}

const SAMPLE_COUNT = 120
const TUBE_RADIUS = 0.7
const PATH_Y_OFFSET = 1.2
const PULSE_SPEED = 0.3

const HealthRidgePath: React.FC<Props> = memo(({ terrainRef, revealedKpis, kpis }) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const pulseRef = useRef(0)

  const { geometry, colors } = useMemo(() => {
    if (!kpis || revealedKpis.size === 0) return { geometry: null, colors: null }

    const terrain = terrainRef.current
    if (!terrain) return { geometry: null, colors: null }

    const points: THREE.Vector3[] = []
    const segColors: { r: number; g: number; b: number }[] = []
    const halfW = 560 * 3.0 / 2

    for (let i = 0; i <= SAMPLE_COUNT; i++) {
      const t = i / SAMPLE_COUNT
      const worldX = -halfW + t * halfW * 2

      // Check if this X position falls in a revealed zone
      let inRevealed = false
      let currentKey: KpiKey | null = null
      for (const key of KPI_KEYS) {
        if (!revealedKpis.has(key)) continue
        const zone = KPI_ZONE_MAP[key]
        if (t >= zone.xStart && t <= zone.xEnd) {
          inRevealed = true
          currentKey = key
          break
        }
      }

      if (!inRevealed) continue

      const worldZ = 0 // midline
      const y = terrain.getHeightAt(worldX, worldZ) + PATH_Y_OFFSET
      points.push(new THREE.Vector3(worldX, y, worldZ))

      if (currentKey) {
        const health = getHealthLevel(currentKey, kpis)
        segColors.push(getHealthColor(health))
      } else {
        segColors.push({ r: 0.13, g: 0.83, b: 0.93 })
      }
    }

    if (points.length < 3) return { geometry: null, colors: null }

    const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5)
    const tubeGeo = new THREE.TubeGeometry(curve, points.length * 2, TUBE_RADIUS, 6, false)

    // Apply vertex colors
    const tubePos = tubeGeo.attributes.position as THREE.BufferAttribute
    const colorArr = new Float32Array(tubePos.count * 3)
    const tubeLength = points.length * 2

    for (let i = 0; i < tubePos.count; i++) {
      const segIndex = Math.floor((i / tubePos.count) * segColors.length)
      const clampedIdx = Math.min(segIndex, segColors.length - 1)
      const c = segColors[clampedIdx]
      colorArr[i * 3] = c.r
      colorArr[i * 3 + 1] = c.g
      colorArr[i * 3 + 2] = c.b
    }
    tubeGeo.setAttribute("color", new THREE.BufferAttribute(colorArr, 3))

    return { geometry: tubeGeo, colors: segColors }
  }, [terrainRef, revealedKpis, kpis])

  // Subtle emissive pulse
  useFrame((_, delta) => {
    pulseRef.current += delta * PULSE_SPEED
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial
      if (mat) {
        mat.opacity = 0.75 + Math.sin(pulseRef.current * Math.PI * 2) * 0.1
      }
    }
  })

  if (!geometry) return null

  return (
    <mesh ref={meshRef} geometry={geometry} renderOrder={10} name="health-ridge-path">
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0.8}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
})

HealthRidgePath.displayName = "HealthRidgePath"
export default HealthRidgePath
