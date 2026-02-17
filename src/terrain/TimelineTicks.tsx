import React, { useMemo } from "react"
import * as THREE from "three"
import { ScreenSpaceMarkerSprite } from "@/render/overlays/ScreenSpaceMarkerSprite"

type Props = {
  /** Explicit tick positions as [x,y,z] or Vector3 */
  ticks?: Array<[number, number, number] | THREE.Vector3>
  /** Shorthand: generate evenly-spaced ticks along X */
  count?: number
  rangeX?: [number, number]
  y?: number
  color?: string
  sizePx?: number
}

export default function TimelineTicks({
  ticks,
  count = 10,
  rangeX = [-50, 40],
  y = 0.02,
  color = "#EAFBFF",
  sizePx = 10,
}: Props) {
  const positions = useMemo(() => {
    if (ticks && ticks.length > 0) {
      return ticks.map((p) =>
        Array.isArray(p) ? new THREE.Vector3(p[0], p[1], p[2]) : p
      )
    }
    const step = (rangeX[1] - rangeX[0]) / Math.max(1, count - 1)
    return Array.from({ length: count }, (_, i) =>
      new THREE.Vector3(rangeX[0] + i * step, y, 0)
    )
  }, [ticks, count, rangeX, y])

  if (positions.length === 0) return null

  return (
    <group>
      {positions.map((pos, i) => (
        <ScreenSpaceMarkerSprite
          key={i}
          position={pos}
          sizePx={sizePx}
          color={color}
          opacity={0.85}
          halo={false}
          renderOrder={85}
        />
      ))}
    </group>
  )
}
