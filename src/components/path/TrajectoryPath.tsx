// src/components/path/TrajectoryPath.tsx
// STRATFIT — Trajectory path overlay stub for Compare dual-path rendering
// Step 26: renders a visual trajectory indicator inside an R3F scene

import React from "react"
import type { PathModifiers } from "@/terrain/scenarioToPathModifiers"

interface TrajectoryPathProps {
  modifiers: PathModifiers
}

/**
 * Stub trajectory path component.
 * Renders a simple line in R3F scene space representing
 * the scenario's projected path.
 *
 * This is a placeholder — wire to P50Path or a dedicated
 * path renderer once the data pipeline is connected.
 */
export default function TrajectoryPath({ modifiers }: TrajectoryPathProps) {
  const points: [number, number, number][] = []
  const steps = 32

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = (t - 0.5) * 4
    const y = modifiers.elevationScale * (0.2 + Math.sin(t * Math.PI) * 0.3)
    const z = Math.sin(t * 3) * modifiers.lateralSway * 0.3
    points.push([x, y, z])
  }

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(points.flat()), 3]}
          count={points.length}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color="#22d3ee"
        transparent
        opacity={modifiers.opacity}
        linewidth={1}
      />
    </line>
  )
}
