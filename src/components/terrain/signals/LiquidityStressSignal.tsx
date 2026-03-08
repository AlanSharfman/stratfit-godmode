// src/components/terrain/signals/LiquidityStressSignal.tsx
// ═══════════════════════════════════════════════════════════════════════════
// 🟡 LIQUIDITY STRESS — Low terrain fog with horizontal spread
//
// Design: Wide, very low disc hugging the terrain surface. Amber-tinted.
// Feels like ground-level fog / mist spreading outward.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, memo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

const BASE_RADIUS = 24
const FOG_HEIGHT = 1.8
const SPREAD_SPEED = 0.25 // Hz — very slow

interface LiquidityStressSignalProps {
  position: [number, number, number]
  severity: number
}

const LiquidityStressSignal: React.FC<LiquidityStressSignalProps> = memo(({ position, severity }) => {
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const outerRef = useRef<THREE.MeshStandardMaterial>(null)
  const radius = BASE_RADIUS + severity * 14

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const drift = Math.sin(t * SPREAD_SPEED * Math.PI * 2) * 0.04
    if (matRef.current) {
      matRef.current.opacity = 0.14 + severity * 0.16 + drift
      matRef.current.emissiveIntensity = 0.2 + severity * 0.15 + drift * 0.5
    }
    if (outerRef.current) {
      outerRef.current.opacity = 0.06 + severity * 0.08 + drift * 0.5
    }
  })

  return (
    <group position={position}>
      {/* Inner fog disc — close to ground */}
      <mesh position={[0, FOG_HEIGHT * 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius * 0.6, 20]} />
        <meshStandardMaterial
          ref={matRef}
          color="#1a1400"
          emissive="#FFB830"
          emissiveIntensity={0.22}
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Outer spread — wider, thinner */}
      <mesh position={[0, FOG_HEIGHT * 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 24]} />
        <meshStandardMaterial
          ref={outerRef}
          color="#FFB830"
          emissive="#FFB830"
          emissiveIntensity={0.08}
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Vertical fog wisps — very thin cylinders */}
      {severity > 0.4 && (
        <mesh position={[0, FOG_HEIGHT, 0]}>
          <cylinderGeometry args={[radius * 0.5, radius * 0.7, FOG_HEIGHT * 2, 12, 1, true]} />
          <meshStandardMaterial
            color="#FFB830"
            emissive="#FFB830"
            emissiveIntensity={0.06}
            transparent
            opacity={0.04 + severity * 0.04}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
})

LiquidityStressSignal.displayName = "LiquidityStressSignal"
export default LiquidityStressSignal
