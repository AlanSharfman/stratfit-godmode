import React, { useMemo } from "react"
import * as THREE from "three"
import { ScreenSpaceMarkerSprite } from "@/render/overlays/ScreenSpaceMarkerSprite"

type Props = {
  /** Explicit node positions as [x,y,z] or Vector3 */
  points?: Array<[number, number, number] | THREE.Vector3>
  /** @deprecated use points */
  nodes?: Array<[number, number, number] | THREE.Vector3>
  color?: string
  sizePx?: number
}

const DEFAULT_NODES: [number, number, number][] = [
  [-20, 0.05, 0],
  [20, 0.05, 0],
]

export default function PathNodes({
  points,
  nodes,
  color,
  sizePx,
}: Props) {
  const pts = useMemo(() => {
    const src = points ?? nodes ?? (DEFAULT_NODES.length > 0 ? DEFAULT_NODES : [])
    if (!src || src.length < 2) return []
    return src.map((p) =>
      Array.isArray(p) ? new THREE.Vector3(p[0], p[1], p[2]) : p.clone()
    )
  }, [points, nodes])

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
            {...(color ? { color } : {})}
            {...(sizePx ? { sizePx } : {})}
          />
        )
      })}
    </group>
  )
}
