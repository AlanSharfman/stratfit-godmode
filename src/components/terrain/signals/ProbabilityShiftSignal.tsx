// src/components/terrain/signals/ProbabilityShiftSignal.tsx
// ═══════════════════════════════════════════════════════════════════════════
// 🟣 PROBABILITY SHIFT — Moving contour ripple
//
// Design: Concentric ring that expands outward, fading as it grows.
// Purple-tinted. Feels like a sonar ping or probability wave.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, memo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

const MIN_RADIUS = 2
const MAX_RADIUS = 22
const RIPPLE_PERIOD = 4 // seconds per full cycle
const RING_THICKNESS = 0.8

interface ProbabilityShiftSignalProps {
  position: [number, number, number]
  severity: number
}

const ProbabilityShiftSignal: React.FC<ProbabilityShiftSignalProps> = memo(({ position, severity }) => {
  const ring1Ref = useRef<THREE.Mesh>(null)
  const mat1Ref = useRef<THREE.MeshStandardMaterial>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)
  const mat2Ref = useRef<THREE.MeshStandardMaterial>(null)
  const maxR = MAX_RADIUS * (0.6 + severity * 0.4)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    // Ring 1 — primary ripple
    const phase1 = (t / RIPPLE_PERIOD) % 1
    const r1 = MIN_RADIUS + phase1 * (maxR - MIN_RADIUS)
    if (ring1Ref.current) {
      ring1Ref.current.scale.set(r1, r1, 1)
    }
    if (mat1Ref.current) {
      mat1Ref.current.opacity = (1 - phase1) * 0.35 * severity
    }

    // Ring 2 — offset by half cycle
    const phase2 = ((t / RIPPLE_PERIOD) + 0.5) % 1
    const r2 = MIN_RADIUS + phase2 * (maxR - MIN_RADIUS)
    if (ring2Ref.current) {
      ring2Ref.current.scale.set(r2, r2, 1)
    }
    if (mat2Ref.current) {
      mat2Ref.current.opacity = (1 - phase2) * 0.25 * severity
    }
  })

  return (
    <group position={position}>
      {/* Ripple ring 1 */}
      <mesh ref={ring1Ref} position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1 - RING_THICKNESS / 2, 1 + RING_THICKNESS / 2, 32]} />
        <meshStandardMaterial
          ref={mat1Ref}
          color="#6C5CE7"
          emissive="#6C5CE7"
          emissiveIntensity={0.35}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Ripple ring 2 — secondary wave */}
      <mesh ref={ring2Ref} position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1 - RING_THICKNESS / 2, 1 + RING_THICKNESS / 2, 32]} />
        <meshStandardMaterial
          ref={mat2Ref}
          color="#6C5CE7"
          emissive="#6C5CE7"
          emissiveIntensity={0.25}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Centre dot — anchor point */}
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 12]} />
        <meshStandardMaterial
          color="#6C5CE7"
          emissive="#6C5CE7"
          emissiveIntensity={0.4 * severity}
          transparent
          opacity={0.25 + severity * 0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
})

ProbabilityShiftSignal.displayName = "ProbabilityShiftSignal"
export default ProbabilityShiftSignal
