import React, { useMemo } from "react"
import * as THREE from "three"
import { ScreenSpaceMarkerSprite } from "@/render/overlays/ScreenSpaceMarkerSprite"

type Props = {
  /** Explicit node positions as [x,y,z] or Vector3 */
  nodes?: Array<[number, number, number] | THREE.Vector3>
  color?: string
  sizePx?: number
}

const DEFAULT_NODES: [number, number, number][] = [
  [-20, 0.05, 0],
  [20, 0.05, 0],
]

export default function PathNodes({
  nodes,
  color = "#EAFBFF",
  sizePx = 18,
}: Props) {
  const positions = useMemo(() => {
    const src = nodes && nodes.length > 0 ? nodes : DEFAULT_NODES
    return src.map((p) =>
      Array.isArray(p) ? new THREE.Vector3(p[0], p[1], p[2]) : p
    )
  }, [nodes])

  if (positions.length === 0) return null

  return (
    <group>
      {positions.map((pos, i) => (
        <ScreenSpaceMarkerSprite
          key={i}
          position={pos}
          sizePx={sizePx}
          liftY={0.28}
          color={color}
          opacity={0.98}
          halo
          renderOrder={160}
        />
      ))}
    </group>
  )
}
