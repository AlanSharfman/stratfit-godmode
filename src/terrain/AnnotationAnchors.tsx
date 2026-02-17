import React, { useMemo } from "react"
import * as THREE from "three"
import { ScreenSpaceMarkerSprite } from "@/render/overlays/ScreenSpaceMarkerSprite"

type Props = {
  /** Explicit anchor positions as [x,y,z] or Vector3 */
  anchors?: Array<[number, number, number] | THREE.Vector3>
  color?: string
  sizePx?: number
}

const DEFAULT_ANCHORS: [number, number, number][] = [
  [0, 1, -2],
]

export default function AnnotationAnchors({
  anchors,
  color = "#38bdf8",
  sizePx = 14,
}: Props) {
  const positions = useMemo(() => {
    const src = anchors && anchors.length > 0 ? anchors : DEFAULT_ANCHORS
    return src.map((p) =>
      Array.isArray(p) ? new THREE.Vector3(p[0], p[1], p[2]) : p
    )
  }, [anchors])

  if (positions.length === 0) return null

  return (
    <group>
      {positions.map((pos, i) => (
        <ScreenSpaceMarkerSprite
          key={i}
          position={pos}
          sizePx={sizePx}
          liftY={0.26}
          color={color}
          opacity={0.90}
          halo
          renderOrder={155}
        />
      ))}
    </group>
  )
}
