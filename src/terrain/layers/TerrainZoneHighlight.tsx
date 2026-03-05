// src/terrain/layers/TerrainZoneHighlight.tsx
// R3F component: renders a color wash over a terrain zone when a KPI is focused.

import React, { memo, useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { useSystemBaseline } from "@/system/SystemBaselineProvider"
import { baselineReliefScalar, baselineSeedString, createSeed } from "@/terrain/seed"
import { buildTerrainWithMetrics } from "@/terrain/buildTerrain"
import type { MetricsInput } from "@/terrain/buildTerrain"
import type { KpiKey, HealthColor } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_ZONE_MAP, getHealthLevel, getHealthColor } from "@/domain/intelligence/kpiZoneMapping"
import type { PositionKpis } from "@/pages/position/overlays/positionState"

interface TerrainZoneHighlightProps {
  focusedKpi: KpiKey | null
  kpis: PositionKpis | null
  terrainMetrics?: MetricsInput
}

const FADE_SPEED = 4.0

const TerrainZoneHighlight: React.FC<TerrainZoneHighlightProps> = memo(
  ({ focusedKpi, kpis, terrainMetrics }) => {
    const meshRef = useRef<THREE.Mesh>(null)
    const matRef = useRef<THREE.MeshBasicMaterial>(null)
    const opacityRef = useRef(0)
    const targetOpacityRef = useRef(0)

    const { baseline } = useSystemBaseline()
    const baselineAny = baseline as any // eslint-disable-line @typescript-eslint/no-explicit-any

    const seedStr = useMemo(() => baselineSeedString(baselineAny), [baselineAny])
    const seed = useMemo(() => createSeed(seedStr), [seedStr])
    const relief = useMemo(() => baselineReliefScalar(baselineAny), [baselineAny])

    const zone = focusedKpi ? KPI_ZONE_MAP[focusedKpi] : null
    const health = focusedKpi && kpis ? getHealthLevel(focusedKpi, kpis) : null
    const color: HealthColor | null = health ? getHealthColor(health) : null

    targetOpacityRef.current = focusedKpi ? 0.38 : 0

    const zoneGeo = useMemo(() => {
      if (!zone) return null

      const geo = buildTerrainWithMetrics(260, seed, relief, terrainMetrics)
      const pos = geo.attributes.position as THREE.BufferAttribute
      const count = pos.count
      const segments = Math.round(Math.sqrt(count)) - 1
      const vertsPerRow = segments + 1

      // Find height range to determine mountain vs flat ground
      let minH = Infinity
      let maxH = -Infinity
      for (let i = 0; i < count; i++) {
        const h = pos.getZ(i) // Z = height in geometry space (before rotation)
        if (h < minH) minH = h
        if (h > maxH) maxH = h
      }
      const heightRange = maxH - minH
      // Only color vertices above 15% of the height range (mountain, not flat ground)
      const heightThreshold = minH + heightRange * 0.15
      const heightFadeRange = heightRange * 0.15 // smooth fade between flat and mountain

      const colors = new Float32Array(count * 3)
      const baseColor = color ?? { r: 0.13, g: 0.83, b: 0.93 }

      for (let i = 0; i < count; i++) {
        const col = i % vertsPerRow
        const normalizedX = col / segments
        const h = pos.getZ(i)

        // Height mask: 0 on flat ground, ramps to 1 on the mountain
        const heightFactor = Math.max(0, Math.min(1, (h - heightThreshold) / heightFadeRange))
        if (heightFactor <= 0) continue // flat ground — no color

        // X-zone mask
        let zoneFactor = 0
        if (zone.xStart === 0 && zone.xEnd === 1) {
          zoneFactor = 1
        } else {
          const edgeFade = 0.06
          const dLeft = normalizedX - zone.xStart
          const dRight = zone.xEnd - normalizedX
          if (dLeft >= 0 && dRight >= 0) {
            zoneFactor = Math.min(dLeft / edgeFade, dRight / edgeFade, 1.0)
          }
        }

        if (zoneFactor <= 0) continue

        const intensity = heightFactor * zoneFactor
        colors[i * 3] = baseColor.r * intensity
        colors[i * 3 + 1] = baseColor.g * intensity
        colors[i * 3 + 2] = baseColor.b * intensity
      }

      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3))
      return geo
    }, [zone, seed, relief, terrainMetrics, color])

    useEffect(() => {
      return () => { zoneGeo?.dispose() }
    }, [zoneGeo])

    useEffect(() => {
      if (!meshRef.current) return
      meshRef.current.rotation.x = -Math.PI / 2
      meshRef.current.position.set(0, -6, 0)
      meshRef.current.scale.set(3.0, 2.8, 2.6)
      meshRef.current.frustumCulled = false
    }, [zoneGeo])

    useFrame((_, delta) => {
      const target = targetOpacityRef.current
      const current = opacityRef.current
      const diff = target - current
      if (Math.abs(diff) > 0.001) {
        opacityRef.current += diff * Math.min(1, delta * FADE_SPEED)
      } else {
        opacityRef.current = target
      }
      if (matRef.current) {
        matRef.current.opacity = opacityRef.current
      }
    })

    if (!zoneGeo) return null

    return (
      <mesh
        ref={meshRef}
        geometry={zoneGeo}
        renderOrder={6}
        name="terrain-zone-highlight"
      >
        <meshBasicMaterial
          ref={matRef}
          vertexColors
          transparent
          opacity={0}
          depthWrite={false}
          depthTest
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
          toneMapped={false}
        />
      </mesh>
    )
  }
)

TerrainZoneHighlight.displayName = "TerrainZoneHighlight"
export default TerrainZoneHighlight
