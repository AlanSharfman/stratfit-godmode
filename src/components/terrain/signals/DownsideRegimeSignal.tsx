// src/components/terrain/signals/DownsideRegimeSignal.tsx
// ═══════════════════════════════════════════════════════════════════════════
// 🔴 DOWNSIDE REGIME — Compound risk field
//
// Design: Wide dark disc with slow crimson pulse.
// Wider and lower than risk_spike — represents systemic pressure.
// Thin vertical spines at edges to convey multi-factor nature.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, memo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

const BASE_RADIUS = 16
const PULSE_SPEED = 0.4 // Hz — slower than risk_spike
const SPINE_HEIGHT = 8

interface DownsideRegimeSignalProps {
  position: [number, number, number]
  severity: number
}

const DownsideRegimeSignal: React.FC<DownsideRegimeSignalProps> = memo(({ position, severity }) => {
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const radius = BASE_RADIUS + severity * 8

  useFrame(({ clock }) => {
    if (!matRef.current) return
    const t = clock.getElapsedTime()
    const pulse = 0.1 + severity * 0.15 + Math.sin(t * PULSE_SPEED * Math.PI * 2) * 0.04
    matRef.current.opacity = pulse
    matRef.current.emissiveIntensity = 0.15 + Math.sin(t * PULSE_SPEED * Math.PI * 2) * 0.06
  })

  // Position thin spines at 4 compass points around the edge
  const spinePositions: [number, number, number][] = [
    [radius * 0.7, SPINE_HEIGHT / 2, 0],
    [-radius * 0.7, SPINE_HEIGHT / 2, 0],
    [0, SPINE_HEIGHT / 2, radius * 0.7],
    [0, SPINE_HEIGHT / 2, -radius * 0.7],
  ]

  return (
    <group position={position}>
      {/* Dark field disc */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 24]} />
        <meshStandardMaterial
          ref={matRef}
          color="#1a0008"
          emissive="#CC2244"
          emissiveIntensity={0.15}
          transparent
          opacity={0.14}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Thin spines — compound risk indicators */}
      {spinePositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <cylinderGeometry args={[0.15, 0.15, SPINE_HEIGHT * severity, 4]} />
          <meshStandardMaterial
            color="#0d0005"
            emissive="#CC2244"
            emissiveIntensity={0.2 * severity}
            transparent
            opacity={0.35 + severity * 0.2}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
})

DownsideRegimeSignal.displayName = "DownsideRegimeSignal"
export default DownsideRegimeSignal
