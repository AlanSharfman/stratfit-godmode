import React, { useMemo } from "react"
import * as THREE from "three"
import { ScreenSpaceTubeLine } from "@/render/overlays/ScreenSpaceTubeLine"

type Props = {
  /** Ordered array of [x,y,z] or Vector3 points */
  points?: Array<[number, number, number] | THREE.Vector3>
  /** Shorthand: line start (ignored if points given) */
  start?: [number, number, number]
  /** Shorthand: line end (ignored if points given) */
  end?: [number, number, number]
  color?: string
  thicknessPx?: number
}

export default function TimelineAxis({
  points,
  start = [-60, 0.02, 0],
  end = [60, 0.02, 0],
  color = "#3B82F6",
  thicknessPx = 8,
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
      opacity={0.98}
      liftY={0.22}
      renderOrder={140}
    />
  )
}
