// src/components/terrain/signals/primitives/RiskSpikeBeam.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Risk Spike Beam (Phase A8.4)
// Vertical thin cylinder + emissive glow. Deterministic clock-driven pulse.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useMemo, memo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { SignalPalette, signalParamsByType } from "../signalStyle"
import type { SignalClock } from "../useSignalClock"

const params = signalParamsByType.risk_spike
const palette = SignalPalette.risk

interface RiskSpikeBeamProps {
  position: [number, number, number]
  intensity: number
  alpha: number
  clock: React.RefObject<SignalClock>
}

const beamGeo = new THREE.CylinderGeometry(0.35, 0.2, 1, 6)
const ringGeo = new THREE.RingGeometry(0.7, 2.0, 16)

const RiskSpikeBeam: React.FC<RiskSpikeBeamProps> = memo(({ position, intensity, alpha, clock }) => {
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const ringMatRef = useRef<THREE.MeshStandardMaterial>(null)
  const beamRef = useRef<THREE.Mesh>(null)

  const height = params.baseHeight * (0.7 + 0.6 * intensity)

  // Shared materials (created once)
  const beamMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#1a0000",
    emissive: palette.primary,
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: params.opacity * alpha,
    depthWrite: false,
  }), [alpha])

  const ringMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: palette.primary,
    emissive: palette.primary,
    emissiveIntensity: 0.25 * intensity,
    transparent: true,
    opacity: (0.15 + intensity * 0.12) * alpha,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), [intensity, alpha])

  // Read shared clock during R3F render loop — no per-signal RAF
  useFrame(() => {
    const c = clock.current
    if (matRef.current) {
      const pulse = 1 + 0.08 * Math.sin(c.t * params.pulseFreq * Math.PI * 2)
      matRef.current.emissiveIntensity = 0.4 * pulse * intensity
      matRef.current.opacity = params.opacity * alpha * pulse
    }
    if (ringMatRef.current) {
      ringMatRef.current.emissiveIntensity = 0.25 * intensity
    }
  })

  return (
    <group position={position}>
      <mesh ref={beamRef} position={[0, height / 2, 0]} geometry={beamGeo} scale={[1, height, 1]}>
        <primitive object={beamMat} ref={matRef} attach="material" />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={ringGeo}>
        <primitive object={ringMat} ref={ringMatRef} attach="material" />
      </mesh>
    </group>
  )
})

RiskSpikeBeam.displayName = "RiskSpikeBeam"
export default RiskSpikeBeam
