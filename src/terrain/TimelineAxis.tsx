import React, { useMemo } from "react"
import * as THREE from "three"
import { ScreenSpaceTubeLine } from "@/render/overlays/ScreenSpaceTubeLine"

type Props = {
  points?: Array<[number, number, number] | THREE.Vector3>
  start?: [number, number, number]
  end?: [number, number, number]
  color?: string
  thicknessPx?: number
}

/**
 * STRATFIT — Timeline Axis (Matte / Reference Layer)
 *
 * Option C rules:
 * - Timeline is reference: matte + subdued (graphite)
 * - Timeline must NEVER compete with path glow
 * - Render behind primary path layer
 * - Slightly lower lift so it reads as a base plane
 */
export default function TimelineAxis({
  points,
  // Lower base plane vs previous (0.02) to reduce perceived intersections.
  start = [-60, -0.06, 0],
  end = [60, -0.06, 0],
  // Matte graphite (no neon)
  color = "#0b1220",
  // Thinner than path
  thicknessPx = 5,
}: Props) {
  const pts = useMemo(() => {
    if (points && points.length >= 2) {
      return points.map((p) =>
        Array.isArray(p) ? new THREE.Vector3(p[0], p[1], p[2]) : p
      )
    }
    return [
      new THREE.Vector3(start[0], start[1], start[2]),
      new THREE.Vector3(end[0], end[1], end[2]),
    ]
  }, [points, start, end])

  if (pts.length < 2) return null

  return (
    <ScreenSpaceTubeLine
      points={pts}
      thicknessPx={thicknessPx}
      color={color}
      // Matte reference opacity (subtle, not dominant)
      opacity={0.42}
      // Lower than previous 0.22 so it sits “under” narrative layers
      liftY={0.08}
      // MUST be behind the path (your path is renderOrder ~48–51)
      renderOrder={22}
    />
  )
}
