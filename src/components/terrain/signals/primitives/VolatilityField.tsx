// src/components/terrain/signals/primitives/VolatilityField.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Volatility Zone Field (Phase A8.4)
// Larger soft disc/field with slow phase drift.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useMemo, memo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { SignalPalette, signalParamsByType } from "../signalStyle"
import type { SignalClock } from "../useSignalClock"

const params = signalParamsByType.volatility_zone
const palette = SignalPalette.volatility

interface VolatilityFieldProps {
  position: [number, number, number]
  intensity: number
  alpha: number
  clock: React.RefObject<SignalClock>
}

const discGeo = new THREE.CircleGeometry(1, 24)
const ringGeo = new THREE.RingGeometry(0.3, 0.6, 20)

const VolatilityField: React.FC<VolatilityFieldProps> = memo(({ position, intensity, alpha, clock }) => {
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const innerMatRef = useRef<THREE.MeshStandardMaterial>(null)

  const radius = params.baseRadius * (1.2 + 1.0 * intensity)

  const discMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#0A1628",
    emissive: palette.primary,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: params.opacity * alpha,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), [alpha])

  const innerMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: palette.primary,
    emissive: palette.primary,
    emissiveIntensity: 0.15 * intensity,
    transparent: true,
    opacity: (0.12 + intensity * 0.1) * alpha,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), [intensity, alpha])

  useFrame(() => {
    const c = clock.current
    const breath = params.opacity * alpha * (0.88 + 0.12 * Math.sin(c.t * params.pulseFreq * Math.PI * 2))
    if (matRef.current) {
      matRef.current.opacity = breath
      matRef.current.emissiveIntensity = 0.2 + Math.sin(c.t * params.pulseFreq * Math.PI * 2) * 0.06
    }
    if (innerMatRef.current) {
      innerMatRef.current.opacity = (0.12 + intensity * 0.1) * alpha
    }
  })

  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={discGeo} scale={[radius, radius, 1]}>
        <primitive object={discMat} ref={matRef} attach="material" />
      </mesh>
      <mesh position={[0, 0.35, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={ringGeo} scale={[radius, radius, 1]}>
        <primitive object={innerMat} ref={innerMatRef} attach="material" />
      </mesh>
    </group>
  )
})

VolatilityField.displayName = "VolatilityField"
export default VolatilityField
