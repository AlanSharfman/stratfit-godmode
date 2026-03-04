// src/components/mountain/RiskWeatherLayer.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Risk Weather Overlay (God Mode only)
//
// Visual weather metaphors for risk signals on the terrain:
//
//   runway < 12mo   →  dark cloud layer near mountain base
//   volatility high →  subtle lightning flicker (animated line)
//   riskIndex > 70  →  turbulence band across mid-slope
//
// These are visual cues only — no business logic computed.
// R3F component — must be inside Canvas.
//
// DO NOT import outside ScenarioMountainImpl god mode block.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { Line as DreiLine } from "@react-three/drei"

const ISLAND_RADIUS = 22

export interface RiskWeatherLayerProps {
  /** Risk index — 0-100, higher = healthier (inverted danger) */
  riskIndex: number
  /** Runway in months */
  runwayMonths: number
  /** Volatility factor 0-1 */
  volatility: number
}

// ── DARK CLOUD LAYER — low runway warning ──
function CloudLayer({ intensity }: { intensity: number }) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (ref.current) {
      // Slow drift
      ref.current.rotation.y = clock.elapsedTime * 0.015
      // Breathing opacity
      const breath = Math.sin(clock.elapsedTime * 0.4) * 0.02
      ;(ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(
        0.02,
        intensity + breath,
      )
    }
  })

  return (
    <mesh ref={ref} position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={4}>
      <circleGeometry args={[ISLAND_RADIUS * 0.75, 48]} />
      <meshBasicMaterial
        color="#1e293b"
        transparent
        opacity={intensity}
        side={THREE.DoubleSide}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

// ── LIGHTNING FLICKER — high volatility ──
function LightningFlicker({ volatility }: { volatility: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const visibleRef = useRef(false)
  const nextFlashRef = useRef(0)

  // Generate deterministic bolt paths
  const bolts = useMemo(() => {
    const result: THREE.Vector3[][] = []
    const count = volatility > 0.8 ? 3 : volatility > 0.6 ? 2 : 1

    for (let b = 0; b < count; b++) {
      const pts: THREE.Vector3[] = []
      const startX = (b - (count - 1) / 2) * 8
      const segments = 6
      let x = startX
      let y = 5 + b * 1.5
      let z = (b % 2 === 0 ? 1 : -1) * 2

      for (let i = 0; i <= segments; i++) {
        pts.push(new THREE.Vector3(x, y, z))
        x += (Math.sin(i * 3.7 + b) * 1.5)
        y -= 1.0 + Math.sin(i * 2.1) * 0.4
        z += Math.cos(i * 2.3 + b) * 0.6
      }
      result.push(pts)
    }
    return result
  }, [volatility])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime

    if (t > nextFlashRef.current) {
      visibleRef.current = true
      // Flash duration ~80ms, next flash 1.5-4s
      nextFlashRef.current = t + 0.08
    } else if (visibleRef.current && t > nextFlashRef.current - 0.08) {
      // Still in flash window — keep visible
    } else if (visibleRef.current) {
      visibleRef.current = false
      // Schedule next: more volatile = more frequent
      const interval = 1.5 + (1 - volatility) * 3.5
      nextFlashRef.current = t + interval + Math.sin(t * 7) * 0.5
    }

    groupRef.current.visible = visibleRef.current
  })

  return (
    <group ref={groupRef} visible={false}>
      {bolts.map((pts, i) => (
        <DreiLine
          key={i}
          points={pts}
          color="#e0f2fe"
          lineWidth={1.5}
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      ))}
    </group>
  )
}

// ── TURBULENCE BAND — high risk index (danger > 70) ──
function TurbulenceBand({ intensity }: { intensity: number }) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (ref.current) {
      // Oscillating distortion feel
      const wave = Math.sin(clock.elapsedTime * 1.2) * 0.3
      ref.current.position.y = 1.5 + wave
      ref.current.rotation.y = clock.elapsedTime * 0.03
      ;(ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(
        0.02,
        intensity * (0.8 + Math.sin(clock.elapsedTime * 0.7) * 0.2),
      )
    }
  })

  return (
    <mesh ref={ref} position={[0, 1.5, 0]} renderOrder={4}>
      <torusGeometry args={[ISLAND_RADIUS * 0.55, 0.8, 6, 48]} />
      <meshBasicMaterial
        color="#dc2626"
        transparent
        opacity={intensity}
        side={THREE.DoubleSide}
        depthWrite={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

export default function RiskWeatherLayer({
  riskIndex,
  runwayMonths,
  volatility,
}: RiskWeatherLayerProps) {
  // Danger level: invert riskIndex (100 = healthy → 0 danger)
  const dangerLevel = 100 - riskIndex

  // Cloud: runway < 12mo → dark clouds, intensity scales with urgency
  const showClouds = runwayMonths < 12
  const cloudIntensity = showClouds
    ? Math.min(0.2, 0.06 + (1 - runwayMonths / 12) * 0.14)
    : 0

  // Lightning: volatility > 0.45
  const showLightning = volatility > 0.45

  // Turbulence: danger > 70 (riskIndex < 30)
  const showTurbulence = dangerLevel > 70
  const turbulenceIntensity = showTurbulence
    ? Math.min(0.12, 0.04 + (dangerLevel - 70) / 30 * 0.08)
    : 0

  // Nothing to render
  if (!showClouds && !showLightning && !showTurbulence) return null

  return (
    <group>
      {showClouds && <CloudLayer intensity={cloudIntensity} />}
      {showLightning && <LightningFlicker volatility={volatility} />}
      {showTurbulence && <TurbulenceBand intensity={turbulenceIntensity} />}
    </group>
  )
}
