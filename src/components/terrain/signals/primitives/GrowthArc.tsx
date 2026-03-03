// src/components/terrain/signals/primitives/GrowthArc.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Growth Inflection Arc (Phase A8.4)
// Upward tapered cone (arc glow) with base halo. Stable, no jitter.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useMemo, memo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { SignalPalette, signalParamsByType } from "../signalStyle"
import type { SignalClock } from "../useSignalClock"

const params = signalParamsByType.growth_inflection
const palette = SignalPalette.growth

interface GrowthArcProps {
  position: [number, number, number]
  intensity: number
  alpha: number
  clock: React.RefObject<SignalClock>
}

const coneGeo = new THREE.CylinderGeometry(0.4, 3.0, 1, 8)
const haloGeo = new THREE.CircleGeometry(1, 16)

const GrowthArc: React.FC<GrowthArcProps> = memo(({ position, intensity, alpha, clock }) => {
  const coneMatRef = useRef<THREE.MeshStandardMaterial>(null)
  const haloMatRef = useRef<THREE.MeshStandardMaterial>(null)

  const height = params.baseHeight * (0.6 + 0.9 * intensity)

  const coneMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#0a1a0a",
    emissive: palette.primary,
    emissiveIntensity: 0.35,
    transparent: true,
    opacity: params.opacity * alpha,
    depthWrite: false,
  }), [alpha])

  const haloMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: palette.primary,
    emissive: palette.primary,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.18 * alpha,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), [alpha])

  useFrame(() => {
    const c = clock.current
    const glow = 0.3 + intensity * 0.25 + Math.sin(c.t * params.pulseFreq * Math.PI * 2) * 0.06
    if (coneMatRef.current) {
      coneMatRef.current.emissiveIntensity = glow
      coneMatRef.current.opacity = params.opacity * alpha * (0.92 + 0.08 * Math.sin(c.t * params.pulseFreq * Math.PI * 2))
    }
    if (haloMatRef.current) {
      haloMatRef.current.emissiveIntensity = glow * 0.6
      haloMatRef.current.opacity = (0.15 + intensity * 0.1) * alpha
    }
  })

  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} geometry={coneGeo} scale={[1, height, 1]}>
        <primitive object={coneMat} ref={coneMatRef} attach="material" />
      </mesh>
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={haloGeo} scale={[7.5, 7.5, 1]}>
        <primitive object={haloMat} ref={haloMatRef} attach="material" />
      </mesh>
    </group>
  )
})

GrowthArc.displayName = "GrowthArc"
export default GrowthArc
