/**
 * StrategicPath — terrain-following trajectory showing company evolution over time.
 *
 * Maps ScenarioTimeline slices (Now → 3M → 6M → 12M → 24M) to positions
 * on the terrain surface, sampling actual height at each point. The path
 * hugs the mountain and visually represents the scenario journey.
 *
 * Render on: WhatIfPage, ComparePage, BoardroomPage.
 * Do NOT render on PositionPage.
 */

import React, { memo, useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import type { ProgressiveTerrainHandle } from "./ProgressiveTerrainSurface"
import type { TimeSlice } from "@/state/scenarioTimelineStore"
import { HORIZON_LABELS, type TimeHorizon } from "@/state/scenarioTimelineStore"
import {
  getHealthLevel,
  HEALTH_ELEVATION,
  PRIMARY_KPI_KEYS,
  PRIMARY_ANCHOR_POSITIONS,
} from "@/domain/intelligence/kpiZoneMapping"

/* ═══════════════════════════════════════════════════════════════════════
   Types & Constants
   ═══════════════════════════════════════════════════════════════════════ */

export interface StrategicPathProps {
  terrainRef: React.RefObject<ProgressiveTerrainHandle | null>
  slices: TimeSlice[]
  /** Path colour — defaults to #6CD4FF */
  color?: string
  visible?: boolean
}

const PATH_Y_LIFT = 1.2
const TUBE_RADIUS = 0.6
const TUBE_RADIAL_SEGMENTS = 8
const CURVE_SAMPLES = 120
const PULSE_SPEED = 0.2
const PULSE_RADIUS = 1.6

const NODE_RADIUS = 1.3
const NODE_SEGMENTS = 16
const NODE_Y_EXTRA = 0.4

const HALF_WORLD_W = (TERRAIN_CONSTANTS.width * 0.9) / 2
const PATH_Z_WORLD = 0

const PATH_COLOR = new THREE.Color("#ffd166")
const GLOW_COLOR = new THREE.Color("#ffd166")
const NODE_COLOR = new THREE.Color("#ffd166")
const PULSE_COLOR = new THREE.Color("#fffbe6")

/* ═══════════════════════════════════════════════════════════════════════
   Utility: compute a "strategic score" for a KPI snapshot, which
   determines the path's Z-axis wander (towards ridges or valleys).
   ═══════════════════════════════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════════════════════════════
   Path geometry builder
   ═══════════════════════════════════════════════════════════════════════ */

const DASH_SIZE = 4
const GAP_SIZE = 1
const DASH_SCROLL_SPEED = 8

interface PathResult {
  tubeGeo: THREE.TubeGeometry
  dashGeo: THREE.BufferGeometry
  nodePositions: { pos: THREE.Vector3; label: string }[]
  curvePoints: THREE.Vector3[]
}

function buildPathGeometry(
  slices: TimeSlice[],
  terrain: ProgressiveTerrainHandle,
): PathResult | null {
  if (slices.length < 2) return null

  const maxT = slices[slices.length - 1].t || 24
  const controlPoints: THREE.Vector3[] = []
  const nodePositions: { pos: THREE.Vector3; label: string }[] = []

  for (const slice of slices) {
    const tNorm = maxT > 0 ? slice.t / maxT : 0
    const worldX = -HALF_WORLD_W * 0.85 + tNorm * HALF_WORLD_W * 1.7

    const score = strategicScore(slice.kpis)
    const worldZ = PATH_Z_WORLD + score * 15

    const terrainY = terrain.getHeightAt(worldX, worldZ)
    const y = terrainY + PATH_Y_LIFT

    const point = new THREE.Vector3(worldX, y, worldZ)
    controlPoints.push(point)
    nodePositions.push({
      pos: new THREE.Vector3(worldX, y + NODE_Y_EXTRA, worldZ),
      label: HORIZON_LABELS[slice.t as TimeHorizon] ?? `${slice.t}M`,
    })
  }

  if (controlPoints.length < 2) return null

  const curve = new THREE.CatmullRomCurve3(controlPoints, false, "catmullrom", 0.5)
  const curvePoints = curve.getPoints(CURVE_SAMPLES)

  const terrainCorrected: THREE.Vector3[] = []
  for (const p of curvePoints) {
    const terrainY = terrain.getHeightAt(p.x, p.z)
    const y = Math.max(p.y, terrainY + PATH_Y_LIFT)
    terrainCorrected.push(new THREE.Vector3(p.x, y, p.z))
  }

  const finalCurve = new THREE.CatmullRomCurve3(terrainCorrected, false, "catmullrom", 0.3)
  const tubeGeo = new THREE.TubeGeometry(finalCurve, CURVE_SAMPLES, TUBE_RADIUS, TUBE_RADIAL_SEGMENTS, false)

  const dashGeo = new THREE.BufferGeometry().setFromPoints(
    finalCurve.getPoints(CURVE_SAMPLES),
  )

  return { tubeGeo, dashGeo, nodePositions, curvePoints: terrainCorrected }
}

/* ═══════════════════════════════════════════════════════════════════════
   Shared geometries
   ═══════════════════════════════════════════════════════════════════════ */

const nodeGeo = new THREE.SphereGeometry(NODE_RADIUS, NODE_SEGMENTS, NODE_SEGMENTS)
const pulseGeo = new THREE.SphereGeometry(PULSE_RADIUS, 8, 8)

/* ═══════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════ */

const StrategicPath: React.FC<StrategicPathProps> = memo(({
  terrainRef,
  slices,
  color,
  visible = true,
}) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const dashLineRef = useRef<THREE.Line>(null)
  const pulseRef = useRef<THREE.Mesh>(null)
  const progressRef = useRef(0)
  const pathColor = useMemo(() => color ? new THREE.Color(color) : PATH_COLOR, [color])

  const pathData = useMemo(() => {
    if (!visible || slices.length < 2) return null
    const terrain = terrainRef.current
    if (!terrain) return null
    return buildPathGeometry(slices, terrain)
  }, [terrainRef, slices, visible])

  const dashLine = useMemo(() => {
    if (!pathData) return null
    const geo = pathData.dashGeo
    const mat = new THREE.LineDashedMaterial({
      color: 0xffd166,
      dashSize: DASH_SIZE,
      gapSize: GAP_SIZE,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    })
    const line = new THREE.Line(geo, mat)
    line.computeLineDistances()
    line.renderOrder = 15
    line.name = "strategic-path-dash"
    return line
  }, [pathData])

  useFrame((_, delta) => {
    if (!pathData || !pulseRef.current) return

    progressRef.current += delta * PULSE_SPEED
    if (progressRef.current > 1) progressRef.current -= 1

    const idx = Math.floor(progressRef.current * (pathData.curvePoints.length - 1))
    const pt = pathData.curvePoints[Math.min(idx, pathData.curvePoints.length - 1)]
    pulseRef.current.position.set(pt.x, pt.y + 0.3, pt.z)

    const scale = 0.6 + Math.sin(progressRef.current * Math.PI * 2) * 0.3
    pulseRef.current.scale.setScalar(scale)

    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial
      if (mat) {
        mat.opacity = 0.7 + Math.sin(progressRef.current * Math.PI * 4) * 0.08
      }
    }

    if (dashLineRef.current) {
      const mat = dashLineRef.current.material as THREE.LineDashedMaterial & { dashOffset: number }
      mat.dashOffset -= delta * DASH_SCROLL_SPEED
    }
  })

  if (!pathData || !visible) return null

  return (
    <group name="strategic-path">
      {/* Main tube path */}
      <mesh
        ref={meshRef}
        geometry={pathData.tubeGeo}
        renderOrder={12}
        name="strategic-path-tube"
      >
        <meshBasicMaterial
          color={pathColor}
          transparent
          opacity={0.85}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Glow tube (slightly larger, more transparent) */}
      <mesh
        geometry={pathData.tubeGeo}
        renderOrder={11}
        scale={[2.0, 2.0, 2.0]}
        name="strategic-path-glow"
      >
        <meshBasicMaterial
          color={GLOW_COLOR}
          transparent
          opacity={0.15}
          depthWrite={false}
          toneMapped={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Time marker nodes */}
      {pathData.nodePositions.map((node, i) => (
        <mesh
          key={i}
          geometry={nodeGeo}
          position={node.pos}
          renderOrder={13}
          name={`strategic-path-node-${node.label}`}
        >
          <meshBasicMaterial
            color={NODE_COLOR}
            transparent
            opacity={0.8}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Animated dashed line overlay */}
      {dashLine && <primitive ref={dashLineRef} object={dashLine} />}

      {/* Moving pulse */}
      <mesh
        ref={pulseRef}
        geometry={pulseGeo}
        renderOrder={14}
        name="strategic-path-pulse"
      >
        <meshBasicMaterial
          color={PULSE_COLOR}
          transparent
          opacity={0.45}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
})

StrategicPath.displayName = "StrategicPath"
export default StrategicPath
