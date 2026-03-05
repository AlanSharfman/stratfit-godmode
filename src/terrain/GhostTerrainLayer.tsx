import React, { useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_KEYS, KPI_ZONE_MAP, HEALTH_ELEVATION, getHealthLevel } from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { baselineSeedString, createSeed } from "@/terrain/seed"

const SEGMENTS = TERRAIN_CONSTANTS.segments
const PEAK_HEIGHT = 45
const LERP_SPEED = 1.8

interface Props {
  revealedKpis: Set<KpiKey>
  kpis: PositionKpis | null
}

export default function GhostTerrainLayer({ revealedKpis, kpis }: Props) {
  const meshRef = useRef<THREE.Mesh>(null)

  const { baseline } = useSystemBaseline()
  const baselineAny = baseline as any
  const seedStr = useMemo(() => baselineSeedString(baselineAny), [baselineAny])
  const seed = useMemo(() => createSeed(seedStr), [seedStr])

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      TERRAIN_CONSTANTS.width,
      TERRAIN_CONSTANTS.depth,
      SEGMENTS,
      SEGMENTS,
    )
    const pos = geo.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, 0)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: 0x88ccee,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      depthTest: true,
    })
  }, [])

  const targetHeights = useMemo(() => {
    const pos = geometry.attributes.position as THREE.BufferAttribute
    const count = pos.count
    const targets = new Float32Array(count)
    if (!kpis) return targets

    const vertsPerRow = SEGMENTS + 1

    const zoneElevations = new Map<KpiKey, number>()
    for (const key of KPI_KEYS) {
      if (!revealedKpis.has(key)) continue
      const health = getHealthLevel(key, kpis)
      zoneElevations.set(key, HEALTH_ELEVATION[health] * PEAK_HEIGHT)
    }

    for (let i = 0; i < count; i++) {
      const col = i % vertsPerRow
      const row = Math.floor(i / vertsPerRow)
      const nx = col / SEGMENTS
      const nz = row / SEGMENTS

      let totalWeight = 0
      let weightedHeight = 0

      for (const [key, elevation] of zoneElevations) {
        const zone = KPI_ZONE_MAP[key]
        const cx = (zone.xStart + zone.xEnd) / 2
        const halfW = (zone.xEnd - zone.xStart) / 2
        const dx = nx - cx
        const dz = nz - 0.5
        const dist = Math.sqrt(dx * dx + dz * dz)
        const radius = halfW * 1.5
        if (dist < radius * 2.5) {
          const falloff = Math.max(0, 1 - dist / (radius * 2.5))
          const w = falloff * falloff * falloff
          totalWeight += w
          weightedHeight += elevation * w
        }
      }

      if (totalWeight > 0) {
        targets[i] = weightedHeight / totalWeight
      }

      const noiseX = nx * 6.0 + seed * 0.01
      const noiseZ = nz * 6.0 + seed * 0.01
      const noise = Math.sin(noiseX * 3.7) * Math.cos(noiseZ * 4.3) * 0.04
      targets[i] += targets[i] * noise
    }

    return targets
  }, [kpis, revealedKpis, geometry, seed])

  useFrame((_, dt) => {
    if (!meshRef.current) return
    const pos = geometry.attributes.position as THREE.BufferAttribute
    let changed = false
    for (let i = 0; i < pos.count; i++) {
      const current = pos.getZ(i)
      const target = targetHeights[i]
      if (Math.abs(current - target) > 0.01) {
        pos.setZ(i, current + (target - current) * Math.min(1, dt * LERP_SPEED))
        changed = true
      }
    }
    if (changed) {
      pos.needsUpdate = true
      geometry.computeVertexNormals()
    }
  })

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.3, 0]}
      renderOrder={-1}
    />
  )
}
