import React, { useMemo } from "react"
import * as THREE from "three"
import { ScreenSpaceMarkerSprite } from "@/render/overlays/ScreenSpaceMarkerSprite"
import { generateP50Spline } from "@/paths/generateP50Spline"
import { useTerrainHeight } from "@/terrain/useTerrainHeight"

type Props = {
  scenarioId?: string
  /** number of ticks along the path */
  count?: number
}

export default function TimelineTicks({
  scenarioId = "baseline",
  count = 16,
}: Props) {
  const heightFn = useTerrainHeight(scenarioId)

  const ticks = useMemo(() => {
    const curve = generateP50Spline(heightFn)
    const denom = Math.max(1, count - 1)

    return Array.from({ length: count }, (_, i) => {
      const t = i / denom
      const p = curve.getPoint(t)
      const y = heightFn(p.x, p.z) + 0.34

      const isYear = i % 4 === 0
      return {
        pos: new THREE.Vector3(p.x, y, p.z),
        sizePx: isYear ? 18 : 11,
        opacity: isYear ? 0.95 : 0.7,
      }
    })
  }, [heightFn, count])

  if (ticks.length === 0) return null

  return (
    <group>
      {ticks.map((t, i) => (
        <ScreenSpaceMarkerSprite
          key={i}
          position={t.pos}
          sizePx={t.sizePx}
          liftY={0.22}
          color="#EAFBFF"
          opacity={t.opacity}
          renderOrder={150}
        />
      ))}
    </group>
  )
}
