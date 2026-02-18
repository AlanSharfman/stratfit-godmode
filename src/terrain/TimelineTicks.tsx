import React, { useMemo } from "react"
import * as THREE from "three"
import { ScreenSpaceMarkerSprite } from "@/render/overlays/ScreenSpaceMarkerSprite"

type Props = {
  ticks?: Array<[number, number, number] | THREE.Vector3>
  count?: number
  rangeX?: [number, number]
  y?: number
  color?: string
  sizePx?: number
}

/**
 * STRATFIT — Timeline Ticks (Matte / Reference Layer)
 *
 * Option C rules:
 * - ticks are secondary reference
 * - darker + smaller + lower opacity
 * - render behind primary path + milestones
 */
export default function TimelineTicks({
  ticks,
  count = 10,
  rangeX = [-50, 40],
  // Lower base Y than previous 0.02
  y = -0.06,
  // Muted slate (NOT white)
  color = "#64748b",
  // Slightly smaller
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
          // Lower than previous 0.26
          liftY={0.10}
          color={color}
          opacity={0.38}
          // Behind the path/milestones
          renderOrder={24}
        />
      ))}
    </group>
  )
}
