// src/terrain/ValleyFogLayer.tsx
// Sprite-based fog particles in zones below the water line threshold.

import React, { memo, useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, KPI_ZONE_MAP, HEALTH_ELEVATION, getHealthLevel } from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"

interface Props {
  revealedKpis: Set<KpiKey>
  kpis: PositionKpis | null
  thresholdElevation?: number
}

const PARTICLES_PER_ZONE = 12
const FOG_Y_BASE = -6
const DRIFT_SPEED = 0.08
const PEAK_HEIGHT = 35

const ValleyFogLayer: React.FC<Props> = memo(({ revealedKpis, kpis, thresholdElevation = 12 }) => {
  const groupRef = useRef<THREE.Group>(null)
  const driftRef = useRef(0)

  // Generate particle positions for zones that are below the threshold
  const particles = useMemo(() => {
    if (!kpis || revealedKpis.size === 0) return []

    const result: Array<{
      position: [number, number, number]
      scale: number
      opacity: number
    }> = []

    const halfW = (TERRAIN_CONSTANTS.width * 3.0) / 2
    const halfD = (TERRAIN_CONSTANTS.depth * 2.6) / 2

    for (const key of KPI_KEYS) {
      if (!revealedKpis.has(key)) continue

      const health = getHealthLevel(key, kpis)
      const elev = HEALTH_ELEVATION[health] * PEAK_HEIGHT

      if (elev >= thresholdElevation) continue // above threshold, no fog

      const zone = KPI_ZONE_MAP[key]
      const depthRatio = 1 - (elev / thresholdElevation)
      const count = Math.ceil(PARTICLES_PER_ZONE * depthRatio)

      for (let i = 0; i < count; i++) {
        const t = zone.xStart + Math.random() * (zone.xEnd - zone.xStart)
        const x = -halfW + t * halfW * 2
        const z = (Math.random() - 0.5) * halfD * 0.6
        const y = FOG_Y_BASE + elev * 2.8 + Math.random() * 4
        const scale = 12 + Math.random() * 18
        const opacity = 0.05 + depthRatio * 0.15

        result.push({
          position: [x, y, z],
          scale,
          opacity,
        })
      }
    }

    return result
  }, [revealedKpis, kpis, thresholdElevation])

  useFrame((_, delta) => {
    driftRef.current += delta * DRIFT_SPEED
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        if (child instanceof THREE.Sprite) {
          const phase = i * 0.7
          child.position.x += Math.sin(driftRef.current + phase) * delta * 0.5
          child.position.y += Math.cos(driftRef.current * 0.5 + phase) * delta * 0.15
        }
      })
    }
  })

  if (particles.length === 0) return null

  return (
    <group ref={groupRef} name="valley-fog">
      {particles.map((p, i) => (
        <sprite key={i} position={p.position} scale={[p.scale, p.scale * 0.4, 1]}>
          <spriteMaterial
            color="#8899aa"
            transparent
            opacity={p.opacity}
            depthWrite={false}
            toneMapped={false}
            fog
          />
        </sprite>
      ))}
    </group>
  )
})

ValleyFogLayer.displayName = "ValleyFogLayer"
export default ValleyFogLayer
