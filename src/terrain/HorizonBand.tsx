import React, { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame, useThree } from "@react-three/fiber"

type Props = {
  x?: number
  y?: number
  z?: number
  width?: number
  height?: number
  opacity?: number
  renderOrder?: number
}

export default function HorizonBand({
  x = 60,
  y = 6.5,
  z = 0,
  width = 6,
  height = 1.8,
  opacity = 0.14,
  renderOrder = 120,
}: Props) {
  const { camera } = useThree()
  const groupRef = useRef<THREE.Group>(null)

  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0x22d3ee),
        transparent: true,
        opacity,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [opacity]
  )

  useEffect(() => {
    return () => {
      mat.dispose()
    }
  }, [mat])

  // Always face camera (billboard in yaw only) — update each frame
  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    const yaw = Math.atan2(camera.position.x - x, camera.position.z - z)
    g.rotation.set(0, yaw, 0)
  })

  return (
    <group ref={groupRef}>
      <mesh position={[x, y, z]} renderOrder={renderOrder}>
        <planeGeometry args={[width, height]} />
        <primitive object={mat} attach="material" />
      </mesh>
    </group>
  )
}
