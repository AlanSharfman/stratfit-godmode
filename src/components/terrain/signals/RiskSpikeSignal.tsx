// src/components/terrain/signals/RiskSpikeSignal.tsx
// ═══════════════════════════════════════════════════════════════════════════
// 🔴 RISK SPIKE — Thin vertical beam with subtle pulse
//
// Design: Narrow emissive cylinder. Low-frequency opacity pulse.
// Intensity = severity. Anchored to terrain.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, memo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

const BEAM_RADIUS = 0.35
const MIN_HEIGHT = 12
const MAX_HEIGHT = 40
const PULSE_SPEED = 0.8 // Hz — low frequency

interface RiskSpikeSignalProps {
  position: [number, number, number]
  severity: number
}

const RiskSpikeSignal: React.FC<RiskSpikeSignalProps> = memo(({ position, severity }) => {
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const height = MIN_HEIGHT + (MAX_HEIGHT - MIN_HEIGHT) * severity

  useFrame(({ clock }) => {
    if (!matRef.current) return
    const t = clock.getElapsedTime()
    // Subtle pulse: oscillate emissive intensity between base and base+0.3
    const pulse = 0.4 + Math.sin(t * PULSE_SPEED * Math.PI * 2) * 0.15 * severity
    matRef.current.emissiveIntensity = pulse
    matRef.current.opacity = 0.5 + severity * 0.35 + Math.sin(t * PULSE_SPEED * Math.PI * 2) * 0.08
  })

  return (
    <group position={position}>
      {/* Vertical beam */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[BEAM_RADIUS, BEAM_RADIUS * 0.6, height, 6]} />
        <meshStandardMaterial
          ref={matRef}
          color="#1a0000"
          emissive="#FF2233"
          emissiveIntensity={0.4}
          transparent
          opacity={0.65}
          depthWrite={false}
        />
      </mesh>

      {/* Ground glow ring */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[BEAM_RADIUS * 2, BEAM_RADIUS * 5, 16]} />
        <meshStandardMaterial
          color="#FF2233"
          emissive="#FF2233"
          emissiveIntensity={0.25 * severity}
          transparent
          opacity={0.2 + severity * 0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
})

RiskSpikeSignal.displayName = "RiskSpikeSignal"
export default RiskSpikeSignal
