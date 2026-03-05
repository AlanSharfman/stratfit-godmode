import React, { useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import { KPI_ZONE_MAP, getHealthLevel, getHealthColor } from "@/domain/intelligence/kpiZoneMapping"
import { getDownstream } from "@/engine/kpiDependencyGraph"
import { KPI_GRAPH } from "@/engine/kpiDependencyGraph"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import type { ProgressiveTerrainHandle } from "@/terrain/ProgressiveTerrainSurface"

interface Props {
  focusedKpi: KpiKey | null
  kpis: PositionKpis | null
  terrainRef: React.RefObject<ProgressiveTerrainHandle>
}

function zoneWorldCenter(key: KpiKey): [number, number] {
  const zone = KPI_ZONE_MAP[key]
  const nx = (zone.xStart + zone.xEnd) / 2
  const halfW = TERRAIN_CONSTANTS.width / 2
  const worldX = (nx - 0.5) * TERRAIN_CONSTANTS.width * 3.0
  const worldZ = 0
  return [worldX, worldZ]
}

export default function DependencyLines({ focusedKpi, kpis, terrainRef }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const materialRefs = useRef<THREE.LineBasicMaterial[]>([])
  const opacityRef = useRef(0)

  const edges = useMemo(() => {
    if (!focusedKpi) return []
    return getDownstream(KPI_GRAPH, focusedKpi)
  }, [focusedKpi])

  const lineObjects = useMemo(() => {
    if (!edges.length || !kpis || !focusedKpi) return []
    materialRefs.current = []

    return edges.map((edge) => {
      const [sx, sz] = zoneWorldCenter(edge.from)
      const [tx, tz] = zoneWorldCenter(edge.to)

      const health = getHealthLevel(edge.to, kpis)
      const color = getHealthColor(health)

      const midX = (sx + tx) / 2
      const midZ = (sz + tz) / 2
      const midY = 8

      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(sx, 0, sz),
        new THREE.Vector3(midX, midY, midZ),
        new THREE.Vector3(tx, 0, tz),
      )
      const points = curve.getPoints(32)
      const geometry = new THREE.BufferGeometry().setFromPoints(points)

      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color(color.r, color.g, color.b),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })
      materialRefs.current.push(material)

      const lineObj = new THREE.Line(geometry, material)
      lineObj.frustumCulled = false
      return { lineObj, key: `${edge.from}-${edge.to}` }
    })
  }, [edges, kpis, focusedKpi])

  useFrame((_state, delta) => {
    const targetOp = focusedKpi && edges.length > 0 ? 0.4 : 0
    opacityRef.current += (targetOp - opacityRef.current) * Math.min(1, delta * 5)

    for (const mat of materialRefs.current) {
      mat.opacity = opacityRef.current
    }

    const terrain = terrainRef.current
    if (terrain) {
      for (const { lineObj } of lineObjects) {
        const geo = lineObj.geometry
        const pos = geo.attributes.position as THREE.BufferAttribute
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i)
          const z = pos.getZ(i)
          const y = terrain.getHeightAt(x, z) + 1.5
          const existingY = pos.getY(i)
          pos.setY(i, Math.max(y, existingY))
        }
        pos.needsUpdate = true
      }
    }
  })

  if (!lineObjects.length) return null

  return (
    <group ref={groupRef}>
      {lineObjects.map(({ lineObj, key }) => (
        <primitive key={key} object={lineObj} />
      ))}
    </group>
  )
}
