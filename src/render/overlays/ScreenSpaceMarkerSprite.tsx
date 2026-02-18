import React, { useMemo } from "react"
import * as THREE from "three"
import { useThree } from "@react-three/fiber"

type Props = {
  position: THREE.Vector3 | [number, number, number]
  color?: string
  sizePx?: number
  opacity?: number
  liftY?: number
  halo?: boolean
  renderOrder?: number
}

export function ScreenSpaceMarkerSprite({
  position,
  color = "#EAFBFF",
  sizePx = 22,
  opacity = 0.98,
  liftY = 0.28,
  halo: _halo,
  renderOrder = 200,
}: Props) {
  const { camera } = useThree()

  const pos = useMemo(() => {
    if (Array.isArray(position)) {
      return new THREE.Vector3(position[0], position[1] + liftY, position[2])
    }
    return position.clone().add(new THREE.Vector3(0, liftY, 0))
  }, [position, liftY])

  const material = useMemo(() => {
    const mat = new THREE.SpriteMaterial({
      color,
      transparent: true,
      opacity,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return mat
  }, [color, opacity])

  const scale = useMemo(() => {
    const distance = camera.position.distanceTo(pos)
    const s = (sizePx / 100) * (distance * 0.015)
    return new THREE.Vector3(s, s, 1)
  }, [camera, pos, sizePx])

  return (
    <sprite position={pos} scale={scale} renderOrder={renderOrder}>
      <spriteMaterial attach="material" {...material} />
    </sprite>
  )
}

export default ScreenSpaceMarkerSprite
