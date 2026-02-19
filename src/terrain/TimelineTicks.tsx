// src/terrain/TimelineTicks.tsx
// STRATFIT — Phase 2.2: Timeline tick labels along the P50 trajectory.
// Renders quarterly labels positioned on the path, hovering above terrain.
// Does NOT modify terrain, path, or camera.

import React, { useEffect, useMemo, useState } from "react"
import { Html } from "@react-three/drei"
import * as THREE from "three"
import type { TerrainSurfaceHandle } from "@/terrain/TerrainSurface"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"

type Props = {
  terrainRef: React.RefObject<TerrainSurfaceHandle>
  horizonMonths?: number
  rebuildKey?: string
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

type Tick = {
  position: THREE.Vector3
  label: string
  t: number
}

/**
 * Replicates the P50Path meander formula to place ticks along the same trajectory.
 * Constants must match P50Path exactly.
 */
function samplePathPoint(
  t: number,
  x0: number,
  x1: number,
  getHeightAt: (x: number, z: number) => number,
): THREE.Vector3 {
  const amp1 = 22
  const amp2 = 9
  const w1 = Math.PI * 2 * 1.05
  const w2 = Math.PI * 2 * 2.35
  const p1 = 0.75
  const p2 = 1.9

  const x = lerp(x0, x1, t)
  const z = Math.sin(t * w1 + p1) * amp1 + Math.sin(t * w2 + p2) * amp2
  const y = getHeightAt(x, z) + 1.8 // tick labels sit higher than path line
  return new THREE.Vector3(x, y, z)
}

function buildTickLabels(horizonMonths: number): { t: number; label: string }[] {
  const ticks: { t: number; label: string }[] = []

  // "Now" at start
  ticks.push({ t: 0.02, label: "Now" })

  // Quarterly ticks (every 3 months), skip month 0
  const quarters = Math.floor(horizonMonths / 3)
  for (let q = 1; q <= quarters; q++) {
    const month = q * 3
    const t = month / horizonMonths
    if (t > 0.98) continue // don't crowd the end

    const label = month <= 12 ? `${month}mo` : `${month}mo`
    ticks.push({ t, label })
  }

  return ticks
}

const TICK_STYLE: React.CSSProperties = {
  color: "rgba(34, 211, 238, 0.75)",
  fontSize: 10,
  fontFamily: "'Inter', system-ui, sans-serif",
  fontWeight: 600,
  letterSpacing: 0.8,
  textTransform: "uppercase" as const,
  whiteSpace: "nowrap" as const,
  pointerEvents: "none" as const,
  userSelect: "none" as const,
  textShadow: "0 1px 4px rgba(0,0,0,0.8)",
}

const TICK_LINE_STYLE: React.CSSProperties = {
  width: 1,
  height: 10,
  background: "rgba(34, 211, 238, 0.35)",
  margin: "0 auto 3px",
}

export default function TimelineTicks({ terrainRef, horizonMonths = 36, rebuildKey }: Props) {
  const [ticks, setTicks] = useState<Tick[]>([])

  const x0 = useMemo(() => -TERRAIN_CONSTANTS.width * 0.36, [])
  const x1 = useMemo(() => TERRAIN_CONSTANTS.width * 0.36, [])

  const tickDefs = useMemo(() => buildTickLabels(horizonMonths), [horizonMonths])

  useEffect(() => {
    const terrain = terrainRef.current
    if (!terrain) return

    const next: Tick[] = tickDefs.map((td) => ({
      position: samplePathPoint(td.t, x0, x1, terrain.getHeightAt),
      label: td.label,
      t: td.t,
    }))

    setTicks(next)
  }, [terrainRef, x0, x1, tickDefs, rebuildKey])

  if (ticks.length === 0) return null

  return (
    <group name="timeline-ticks">
      {ticks.map((tick, i) => (
        <Html
          key={`tick-${i}`}
          position={tick.position}
          center
          distanceFactor={280}
          style={{ pointerEvents: "none" }}
          zIndexRange={[100, 0]}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={TICK_STYLE}>{tick.label}</div>
            <div style={TICK_LINE_STYLE} />
          </div>
        </Html>
      ))}
    </group>
  )
}
