// src/components/terrain/signals/primitives/ProbabilityRipple.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Probability Shift Ripple (Phase A8.4)
// Expanding ring with fading opacity. Sonar-ping aesthetic.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useMemo, memo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { SignalPalette, signalParamsByType } from "../signalStyle"
import type { SignalClock } from "../useSignalClock"

const params = signalParamsByType.probability_shift
const palette = SignalPalette.shift

const RIPPLE_PERIOD = 3.5 // seconds per full cycle
const RING_THICKNESS = 0.8

interface ProbabilityRippleProps {
  position: [number, number, number]
  intensity: number
  alpha: number
  clock: React.RefObject<SignalClock>
}

const ringGeo = new THREE.RingGeometry(1 - RING_THICKNESS / 2, 1 + RING_THICKNESS / 2, 32)
const dotGeo = new THREE.CircleGeometry(1.2, 12)

const ProbabilityRipple: React.FC<ProbabilityRippleProps> = memo(({ position, intensity, alpha, clock }) => {
  const ring1Ref = useRef<THREE.Mesh>(null)
  const mat1Ref = useRef<THREE.MeshStandardMaterial>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)
  const mat2Ref = useRef<THREE.MeshStandardMaterial>(null)

  const maxR = params.baseRadius * (0.7 + 0.7 * intensity)
  const minR = 2

  const ring1Mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: palette.primary,
    emissive: palette.primary,
    emissiveIntensity: 0.35,
    transparent: true,
    opacity: params.opacity * alpha,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), [alpha])

  const ring2Mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: palette.primary,
    emissive: palette.primary,
    emissiveIntensity: 0.25,
    transparent: true,
    opacity: params.opacity * 0.7 * alpha,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), [alpha])

  useFrame(() => {
    const c = clock.current
    // Ring 1 — primary ripple
    const phase1 = (c.t / RIPPLE_PERIOD) % 1
    const r1 = minR + phase1 * (maxR - minR)
    if (ring1Ref.current) ring1Ref.current.scale.set(r1, r1, 1)
    if (mat1Ref.current) mat1Ref.current.opacity = (1 - phase1) * params.opacity * intensity * alpha

    // Ring 2 — offset half cycle
    const phase2 = ((c.t / RIPPLE_PERIOD) + 0.5) % 1
    const r2 = minR + phase2 * (maxR - minR)
    if (ring2Ref.current) ring2Ref.current.scale.set(r2, r2, 1)
    if (mat2Ref.current) mat2Ref.current.opacity = (1 - phase2) * params.opacity * 0.65 * intensity * alpha
  })

  return (
    <group position={position}>
      <mesh ref={ring1Ref} position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={ringGeo}>
        <primitive object={ring1Mat} ref={mat1Ref} attach="material" />
      </mesh>
      <mesh ref={ring2Ref} position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={ringGeo}>
        <primitive object={ring2Mat} ref={mat2Ref} attach="material" />
      </mesh>
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={dotGeo}>
        <meshStandardMaterial
          color={palette.primary}
          emissive={palette.primary}
          emissiveIntensity={0.4 * intensity}
          transparent
          opacity={(0.2 + intensity * 0.15) * alpha}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
})

ProbabilityRipple.displayName = "ProbabilityRipple"
export default ProbabilityRipple
