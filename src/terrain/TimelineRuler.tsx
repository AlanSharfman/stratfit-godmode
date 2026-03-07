// src/terrain/TimelineRuler.tsx
// R3F component: renders month tick marks and labels along the terrain X axis.
// Uses studio timeline engine data when available, otherwise falls back to
// a baseline-derived or default 24-month horizon.

import React, { useMemo, useRef } from "react"
import * as THREE from "three"
import { Html } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"
import { useStudioTimelineStore } from "@/stores/studioTimelineStore"
import { useBaselineStore } from "@/state/baselineStore"

type Props = {
  terrainRef: React.RefObject<{ getHeightAt: (worldX: number, worldZ: number) => number } | null>
  visible?: boolean
}

const TICK_COLOR = "#00E0FF"
const TICK_HEIGHT = 3.5
const Z_OFFSET = TERRAIN_CONSTANTS.depth * 0.42
const DEFAULT_HORIZON_MONTHS = 24

function buildTicks(horizonMonths: number): Array<{ month: number; worldX: number }> {
  const n = Math.max(2, Math.round(horizonMonths))
  const x0 = -TERRAIN_CONSTANTS.width * 0.36
  const x1 = TERRAIN_CONSTANTS.width * 0.36

  const interval = n <= 12 ? 1 : n <= 24 ? 3 : 6
  const result: Array<{ month: number; worldX: number }> = []

  for (let m = 0; m < n; m += interval) {
    const t = m / (n - 1)
    result.push({ month: m, worldX: x0 + (x1 - x0) * t })
  }
  if (result[result.length - 1]?.month !== n - 1) {
    result.push({ month: n - 1, worldX: x1 })
  }
  return result
}

export default function TimelineRuler({ terrainRef, visible = true }: Props) {
  const engineResults = useStudioTimelineStore((s) => s.engineResults)
  const baselineInputs = useBaselineStore((s) => s.baselineInputs)

  const ticks = useMemo(() => {
    // Priority 1: real engine timeline data
    if (engineResults && engineResults.timeline.length >= 2) {
      return buildTicks(engineResults.timeline.length)
    }

    // Priority 2: baseline runway as horizon
    const runway = baselineInputs?.runwayMonths
    if (runway && Number.isFinite(runway) && runway >= 3) {
      return buildTicks(Math.min(Math.round(runway), 60))
    }

    // Priority 3: default 24-month horizon
    return buildTicks(DEFAULT_HORIZON_MONTHS)
  }, [engineResults, baselineInputs?.runwayMonths])

  if (!visible || ticks.length === 0) return null

  return (
    <group name="timeline-ruler">
      {ticks.map(({ month, worldX }) => {
        return (
          <TimelineTick key={month} terrainRef={terrainRef} month={month} worldX={worldX} />
        )
      })}
    </group>
  )
}

function TimelineTick({
  terrainRef,
  month,
  worldX,
}: {
  terrainRef: React.RefObject<{ getHeightAt: (worldX: number, worldZ: number) => number } | null>
  month: number
  worldX: number
}) {
  const lineGeomRef = useRef<THREE.BufferGeometry>(null)
  const labelGroupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    const terrain = terrainRef.current
    const lineGeom = lineGeomRef.current
    if (!terrain || !lineGeom) return

    const baseY = terrain.getHeightAt(worldX, Z_OFFSET)
    const y0 = baseY + 0.3
    const y1 = y0 + TICK_HEIGHT
    const positions = lineGeom.attributes.position as THREE.BufferAttribute
    positions.setXYZ(0, 0, y0, 0)
    positions.setXYZ(1, 0, y1, 0)
    positions.needsUpdate = true

    if (labelGroupRef.current) {
      labelGroupRef.current.position.set(0, y1 + 0.8, 0)
    }
  })

  return (
    <group position={[worldX, 0, Z_OFFSET]}>
      <line>
        <bufferGeometry ref={lineGeomRef}>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0, 0, 0, TICK_HEIGHT, 0]), 3]}
            count={2}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={TICK_COLOR}
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </line>

      <group ref={labelGroupRef}>
        <Html
          center
          distanceFactor={120}
          style={{ pointerEvents: "none" }}
        >
          <span
            style={{
              color: TICK_COLOR,
              fontSize: 10,
              fontWeight: 600,
              fontFamily: "monospace",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              opacity: 0.75,
              whiteSpace: "nowrap",
              textShadow: "0 0 6px rgba(0,224,255,0.4)",
            }}
          >
            M{month}
          </span>
        </Html>
      </group>
    </group>
  )
}
