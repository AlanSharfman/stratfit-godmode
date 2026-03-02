// src/components/terrain/signals/GrowthInflectionSignal.tsx
// ═══════════════════════════════════════════════════════════════════════════
// 🟢 GROWTH INFLECTION — Upward arc glow with directional gradient
//
// Design: Vertical tapered cone with green emissive, subtle upward
// intensity shift. Feels like energy rising from the terrain.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, memo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

const MIN_HEIGHT = 10
const MAX_HEIGHT = 30
const BASE_RADIUS = 3.0
const TIP_RADIUS = 0.4
const GLOW_SPEED = 0.6 // Hz

interface GrowthInflectionSignalProps {
  position: [number, number, number]
  severity: number
}

const GrowthInflectionSignal: React.FC<GrowthInflectionSignalProps> = memo(({ position, severity }) => {
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const haloRef = useRef<THREE.MeshStandardMaterial>(null)
  const height = MIN_HEIGHT + (MAX_HEIGHT - MIN_HEIGHT) * severity

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const glow = 0.3 + severity * 0.25 + Math.sin(t * GLOW_SPEED * Math.PI * 2) * 0.08
    if (matRef.current) matRef.current.emissiveIntensity = glow
    if (haloRef.current) {
      haloRef.current.emissiveIntensity = glow * 0.6
      haloRef.current.opacity = 0.15 + severity * 0.12 + Math.sin(t * GLOW_SPEED * Math.PI * 2) * 0.04
    }
  })

  return (
    <group position={position}>
      {/* Upward tapered cone — arc glow */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[TIP_RADIUS, BASE_RADIUS, height, 8]} />
        <meshStandardMaterial
          ref={matRef}
          color="#0a1a0a"
          emissive="#2ECC71"
          emissiveIntensity={0.35}
          transparent
          opacity={0.55 + severity * 0.25}
          depthWrite={false}
        />
      </mesh>

      {/* Base halo — directional gradient feel at terrain level */}
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[BASE_RADIUS * 2.5, 16]} />
        <meshStandardMaterial
          ref={haloRef}
          color="#2ECC71"
          emissive="#2ECC71"
          emissiveIntensity={0.2}
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
})

GrowthInflectionSignal.displayName = "GrowthInflectionSignal"
export default GrowthInflectionSignal
