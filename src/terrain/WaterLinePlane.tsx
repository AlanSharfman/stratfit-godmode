// src/terrain/WaterLinePlane.tsx
// Translucent horizontal plane at the "healthy" elevation threshold.
// Zones above = healthy (clear). Zones below = at risk (underwater).

import React, { memo, useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { TERRAIN_CONSTANTS } from "@/terrain/terrainConstants"

interface Props {
  visible: boolean
  thresholdY?: number
}

const DEFAULT_THRESHOLD_Y = 12
const PULSE_SPEED = 0.15

const WaterLinePlane: React.FC<Props> = memo(({ visible, thresholdY = DEFAULT_THRESHOLD_Y }) => {
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const edgeRef = useRef<THREE.LineLoop>(null)
  const pulseRef = useRef(0)
  const currentOpacity = useRef(0)

  const planeGeo = useMemo(() => {
    return new THREE.PlaneGeometry(
      TERRAIN_CONSTANTS.width * 3.0,
      TERRAIN_CONSTANTS.depth * 2.6,
    )
  }, [])

  const edgeGeo = useMemo(() => {
    const hw = (TERRAIN_CONSTANTS.width * 3.0) / 2
    const hd = (TERRAIN_CONSTANTS.depth * 2.6) / 2
    const pts = [
      new THREE.Vector3(-hw, 0, -hd),
      new THREE.Vector3(hw, 0, -hd),
      new THREE.Vector3(hw, 0, hd),
      new THREE.Vector3(-hw, 0, hd),
    ]
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [])

  useFrame((_, delta) => {
    const targetOp = visible ? 0.06 : 0
    const diff = targetOp - currentOpacity.current
    if (Math.abs(diff) > 0.001) {
      currentOpacity.current += diff * Math.min(1, delta * 3.0)
    } else {
      currentOpacity.current = targetOp
    }

    if (matRef.current) {
      pulseRef.current += delta * PULSE_SPEED
      const pulse = Math.sin(pulseRef.current * Math.PI * 2) * 0.01
      matRef.current.opacity = currentOpacity.current + pulse
    }
  })

  const worldY = thresholdY * 2.8 + TERRAIN_CONSTANTS.yOffset

  return (
    <group position={[0, worldY, 0]}>
      <mesh geometry={planeGeo} rotation={[-Math.PI / 2, 0, 0]} renderOrder={8} name="water-line-plane">
        <meshBasicMaterial
          ref={matRef}
          color="#22d3ee"
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <lineLoop geometry={edgeGeo} renderOrder={9} name="water-line-edge">
        <lineBasicMaterial color="#22d3ee" transparent opacity={visible ? 0.25 : 0} />
      </lineLoop>
    </group>
  )
})

WaterLinePlane.displayName = "WaterLinePlane"
export default WaterLinePlane
