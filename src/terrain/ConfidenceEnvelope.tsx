/**
 * ConfidenceEnvelope — translucent ribbon mesh between P25 and P75
 * strategic paths, visualising the range of probable outcomes.
 *
 * The P50 (median) path is rendered by StrategicPath. This component
 * only renders the uncertainty ribbon surrounding it.
 *
 * Render on: WhatIfPage, ComparePage, BoardroomPage.
 * Do NOT render on PositionPage.
 */

import React, { memo, useMemo } from "react"
import * as THREE from "three"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import type { ProgressiveTerrainHandle } from "./ProgressiveTerrainSurface"
import type { TimeSlice } from "@/state/scenarioTimelineStore"
import {
  getHealthLevel,
  HEALTH_ELEVATION,
  PRIMARY_KPI_KEYS,
} from "@/domain/intelligence/kpiZoneMapping"

export interface ConfidenceEnvelopeProps {
  terrainRef: React.RefObject<ProgressiveTerrainHandle | null>
  p25Slices: TimeSlice[]
  p75Slices: TimeSlice[]
  visible?: boolean
}

const CURVE_SAMPLES = 80
const PATH_Y_LIFT = 0.8
const RIBBON_Y_LIFT = 0.4
const HALF_WORLD_W = (TERRAIN_CONSTANTS.width * 3.0) / 2
const PATH_Z_WORLD = 0

const ENVELOPE_COLOR = new THREE.Color("#6CD4FF")

function strategicScore(kpis: PositionKpis): number {
  let total = 0
  let count = 0
  for (const key of PRIMARY_KPI_KEYS) {
    const elev = HEALTH_ELEVATION[getHealthLevel(key, kpis)]
    total += elev
    count++
  }
  return count > 0 ? total / count : 0
}

function buildBandCurve(
  slices: TimeSlice[],
  terrain: ProgressiveTerrainHandle,
): THREE.Vector3[] | null {
  if (slices.length < 2) return null

  const maxT = slices[slices.length - 1].t || 24
  const controlPoints: THREE.Vector3[] = []

  for (const slice of slices) {
    const tNorm = maxT > 0 ? slice.t / maxT : 0
    const worldX = -HALF_WORLD_W * 0.85 + tNorm * HALF_WORLD_W * 1.7
    const score = strategicScore(slice.kpis)
    const worldZ = PATH_Z_WORLD + score * 15
    const terrainY = terrain.getHeightAt(worldX, worldZ)
    const y = Math.max(terrainY + RIBBON_Y_LIFT, terrainY + PATH_Y_LIFT * 0.5)
    controlPoints.push(new THREE.Vector3(worldX, y, worldZ))
  }

  if (controlPoints.length < 2) return null

  const curve = new THREE.CatmullRomCurve3(controlPoints, false, "catmullrom", 0.5)
  const rawPoints = curve.getPoints(CURVE_SAMPLES)

  const corrected: THREE.Vector3[] = []
  for (const p of rawPoints) {
    const tY = terrain.getHeightAt(p.x, p.z)
    corrected.push(new THREE.Vector3(p.x, Math.max(p.y, tY + RIBBON_Y_LIFT), p.z))
  }

  return corrected
}

function buildRibbonGeometry(
  lower: THREE.Vector3[],
  upper: THREE.Vector3[],
): THREE.BufferGeometry | null {
  const count = Math.min(lower.length, upper.length)
  if (count < 2) return null

  const vertices: number[] = []
  const indices: number[] = []

  for (let i = 0; i < count; i++) {
    const lo = lower[i]
    const up = upper[i]
    vertices.push(lo.x, lo.y, lo.z)
    vertices.push(up.x, up.y, up.z)
  }

  for (let i = 0; i < count - 1; i++) {
    const bl = i * 2
    const br = bl + 1
    const tl = bl + 2
    const tr = bl + 3

    // Two triangles per quad — front face
    indices.push(bl, tl, br)
    indices.push(br, tl, tr)
    // Back face
    indices.push(bl, br, tl)
    indices.push(br, tr, tl)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

const ConfidenceEnvelope: React.FC<ConfidenceEnvelopeProps> = memo(({
  terrainRef,
  p25Slices,
  p75Slices,
  visible = true,
}) => {
  const ribbonGeo = useMemo(() => {
    if (!visible || p25Slices.length < 2 || p75Slices.length < 2) return null
    const terrain = terrainRef.current
    if (!terrain) return null

    const lowerCurve = buildBandCurve(p25Slices, terrain)
    const upperCurve = buildBandCurve(p75Slices, terrain)
    if (!lowerCurve || !upperCurve) return null

    return buildRibbonGeometry(lowerCurve, upperCurve)
  }, [terrainRef, p25Slices, p75Slices, visible])

  if (!ribbonGeo || !visible) return null

  return (
    <group name="confidence-envelope">
      <mesh
        geometry={ribbonGeo}
        renderOrder={10}
        name="confidence-ribbon"
      >
        <meshBasicMaterial
          color={ENVELOPE_COLOR}
          transparent
          opacity={0.12}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
})

ConfidenceEnvelope.displayName = "ConfidenceEnvelope"
export default ConfidenceEnvelope
