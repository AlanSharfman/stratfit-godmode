import React, { useMemo } from "react"
import * as THREE from "three"
import { ScreenSpaceMarkerSprite } from "@/render/overlays/ScreenSpaceMarkerSprite"
import { generateP50Spline } from "@/paths/generateP50Spline"
import { useTerrainHeight } from "@/terrain/useTerrainHeight"

type Props = {
  scenarioId?: string
  /** show N nodes as milestones (including origin/current) */
  count?: number
}

export default function PathNodes({
  scenarioId = "baseline",
  count = 10,
}: Props) {
  const heightFn = useTerrainHeight(scenarioId)

  const pts = useMemo(() => {
    const curve = generateP50Spline(heightFn)
    const denom = Math.max(1, count - 1)

    return Array.from({ length: count }, (_, i) => {
      const t = i / denom
      const p = curve.getPoint(t)
      const y = heightFn(p.x, p.z) + 0.40
      return new THREE.Vector3(p.x, y, p.z)
    })
  }, [heightFn, count])

  if (pts.length < 2) return null
  const last = pts.length - 1

  return (
    <group>
      {pts.map((p, i) => {
        const variant =
          i === 0 ? "origin" : i === last ? "current" : "milestone"

        return (
          <ScreenSpaceMarkerSprite
            key={i}
            position={p}
            variant={variant}
            sizePx={i === 0 || i === last ? 16 : 12}
          />
        )
      })}
    </group>
  )
}
