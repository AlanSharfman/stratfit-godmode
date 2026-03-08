// src/components/terrain/signals/VolatilityZoneSignal.tsx
// ═══════════════════════════════════════════════════════════════════════════
// 🟦 VOLATILITY ZONE — Soft translucent field with breathing opacity
//
// Design: Low flat disc at terrain level. Gentle opacity oscillation.
// Feels like an unstable region on the terrain surface.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, memo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

const BASE_RADIUS = 18
const FIELD_HEIGHT = 0.3
const BREATH_SPEED = 0.35 // Hz — slow breathing

interface VolatilityZoneSignalProps {
  position: [number, number, number]
  severity: number
}

const VolatilityZoneSignal: React.FC<VolatilityZoneSignalProps> = memo(({ position, severity }) => {
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const radius = BASE_RADIUS + severity * 10

  useFrame(({ clock }) => {
    if (!matRef.current) return
    const t = clock.getElapsedTime()
    // Breathing opacity
    const breath = 0.12 + severity * 0.18 + Math.sin(t * BREATH_SPEED * Math.PI * 2) * 0.06
    matRef.current.opacity = breath
    matRef.current.emissiveIntensity = 0.2 + Math.sin(t * BREATH_SPEED * Math.PI * 2) * 0.08
  })

  return (
    <group position={position}>
      {/* Translucent field disc */}
      <mesh position={[0, FIELD_HEIGHT, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 24]} />
        <meshStandardMaterial
          ref={matRef}
          color="#0A1628"
          emissive="#4488FF"
          emissiveIntensity={0.2}
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Inner ring — tighter, brighter */}
      <mesh position={[0, FIELD_HEIGHT + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 0.3, radius * 0.6, 20]} />
        <meshStandardMaterial
          color="#4488FF"
          emissive="#4488FF"
          emissiveIntensity={0.15 * severity}
          transparent
          opacity={0.12 + severity * 0.1}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
})

VolatilityZoneSignal.displayName = "VolatilityZoneSignal"
export default VolatilityZoneSignal
