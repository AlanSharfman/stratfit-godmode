// src/components/terrain/signals/primitives/LiquidityStressField.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Liquidity Stress Field (Phase A8.4)
// Low disc/plane slightly above terrain. Amber fog spread.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useMemo, memo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { SignalPalette, signalParamsByType } from "../signalStyle"
import type { SignalClock } from "../useSignalClock"

const params = signalParamsByType.liquidity_stress
const palette = SignalPalette.liquidity

interface LiquidityStressFieldProps {
  position: [number, number, number]
  intensity: number
  alpha: number
  clock: React.RefObject<SignalClock>
}

const innerGeo = new THREE.CircleGeometry(1, 20)
const outerGeo = new THREE.CircleGeometry(1, 24)

const LiquidityStressField: React.FC<LiquidityStressFieldProps> = memo(({ position, intensity, alpha, clock }) => {
  const innerMatRef = useRef<THREE.MeshStandardMaterial>(null)
  const outerMatRef = useRef<THREE.MeshStandardMaterial>(null)

  const radius = params.baseRadius * (0.9 + 0.8 * intensity)

  const innerMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#1a1400",
    emissive: palette.primary,
    emissiveIntensity: 0.22,
    transparent: true,
    opacity: params.opacity * alpha,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), [alpha])

  const outerMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: palette.primary,
    emissive: palette.primary,
    emissiveIntensity: 0.08,
    transparent: true,
    opacity: 0.08 * alpha,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), [alpha])

  useFrame(() => {
    const c = clock.current
    const breath = params.opacity * alpha * (0.85 + 0.15 * Math.sin(c.t * 0.8))
    if (innerMatRef.current) {
      innerMatRef.current.opacity = breath
      innerMatRef.current.emissiveIntensity = 0.2 + intensity * 0.15 + Math.sin(c.t * 0.8) * 0.04
    }
    if (outerMatRef.current) {
      outerMatRef.current.opacity = (0.06 + intensity * 0.08) * alpha + Math.sin(c.t * 0.8) * 0.02
    }
  })

  return (
    <group position={position}>
      <mesh position={[0, 0.7, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={innerGeo} scale={[radius * 0.6, radius * 0.6, 1]}>
        <primitive object={innerMat} ref={innerMatRef} attach="material" />
      </mesh>
      <mesh position={[0, 0.35, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={outerGeo} scale={[radius, radius, 1]}>
        <primitive object={outerMat} ref={outerMatRef} attach="material" />
      </mesh>
    </group>
  )
})

LiquidityStressField.displayName = "LiquidityStressField"
export default LiquidityStressField
