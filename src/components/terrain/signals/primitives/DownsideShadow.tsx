// src/components/terrain/signals/primitives/DownsideShadow.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Downside Regime Shadow (Phase A8.4)
// Darkened ellipse with thin edge spines. Subtle, not muddy.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useMemo, memo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { SignalPalette, signalParamsByType } from "../signalStyle"
import type { SignalClock } from "../useSignalClock"

const params = signalParamsByType.downside_regime
const palette = SignalPalette.downside

interface DownsideShadowProps {
  position: [number, number, number]
  intensity: number
  alpha: number
  clock: React.RefObject<SignalClock>
}

const discGeo = new THREE.CircleGeometry(1, 24)
const spineGeo = new THREE.CylinderGeometry(0.15, 0.15, 1, 4)

const DownsideShadow: React.FC<DownsideShadowProps> = memo(({ position, intensity, alpha, clock }) => {
  const matRef = useRef<THREE.MeshStandardMaterial>(null)

  const radius = params.baseRadius + intensity * 8

  const discMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#1a0010",
    emissive: palette.primary,
    emissiveIntensity: 0.15,
    transparent: true,
    opacity: params.opacity * alpha,
    side: THREE.DoubleSide,
    depthWrite: false,
  }), [alpha])

  // 4 compass spines
  const spinePositions: [number, number, number][] = useMemo(() => [
    [radius * 0.7, params.baseHeight * intensity / 2, 0],
    [-radius * 0.7, params.baseHeight * intensity / 2, 0],
    [0, params.baseHeight * intensity / 2, radius * 0.7],
    [0, params.baseHeight * intensity / 2, -radius * 0.7],
  ], [radius, intensity])

  const spineHeight = params.baseHeight * intensity

  useFrame(() => {
    const c = clock.current
    const pulse = params.opacity * alpha * (0.9 + 0.1 * Math.sin(c.t * params.pulseFreq * Math.PI * 2))
    if (matRef.current) {
      matRef.current.opacity = pulse
      matRef.current.emissiveIntensity = 0.15 + Math.sin(c.t * params.pulseFreq * Math.PI * 2) * 0.04
    }
  })

  return (
    <group position={position}>
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={discGeo} scale={[radius, radius, 1]}>
        <primitive object={discMat} ref={matRef} attach="material" />
      </mesh>
      {spinePositions.map((pos, i) => (
        <mesh key={i} position={pos} geometry={spineGeo} scale={[1, spineHeight, 1]}>
          <meshStandardMaterial
            color="#0d0008"
            emissive={palette.accent}
            emissiveIntensity={0.2 * intensity}
            transparent
            opacity={(0.3 + intensity * 0.2) * alpha}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
})

DownsideShadow.displayName = "DownsideShadow"
export default DownsideShadow
