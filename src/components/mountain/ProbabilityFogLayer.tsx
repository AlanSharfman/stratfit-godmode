// src/components/mountain/ProbabilityFogLayer.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Probability Fog Overlay (God Mode only)
//
// Soft particle-like fog around mountain ridges that visualises outcome
// dispersion from Monte Carlo percentiles.
//
// Dispersion = (P90 - P10) / P50
//   < 0.3  →  minimal fog (near-clear)
//   0.3–0.7 → moderate fog (cyan haze)
//   > 0.7  →  dense fog (thick, low visibility)
//
// Renders as layered translucent cylinders with upward opacity fade.
// Colour: muted cyan (#0e7490). R3F component — must be inside Canvas.
//
// DO NOT import outside ScenarioMountainImpl god mode block.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"

const ISLAND_RADIUS = 22
const FOG_COLOR = new THREE.Color("#0e7490")

export interface ProbabilityFogLayerProps {
  /** P10 enterprise value (pessimistic) */
  p10: number
  /** P50 enterprise value (median) */
  p50: number
  /** P90 enterprise value (optimistic) */
  p90: number
}

/** Map dispersion to fog density 0–1 */
function dispersionToDensity(dispersion: number): number {
  if (dispersion < 0.15) return 0.0
  if (dispersion < 0.3) return 0.08
  if (dispersion < 0.5) return 0.18
  if (dispersion < 0.7) return 0.28
  return Math.min(0.4, 0.28 + (dispersion - 0.7) * 0.4)
}

/** Single fog ring — a translucent torus at a given height */
function FogRing({
  y,
  radius,
  density,
  tubeRadius,
  speed,
}: {
  y: number
  radius: number
  density: number
  tubeRadius: number
  speed: number
}) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (ref.current) {
      // Gentle drift rotation
      ref.current.rotation.y = clock.elapsedTime * speed
      // Subtle breathing
      const breath = Math.sin(clock.elapsedTime * 0.6 + y * 2) * 0.015
      const mat = ref.current.material as THREE.MeshBasicMaterial
      mat.opacity = Math.max(0.01, density + breath)
    }
  })

  return (
    <mesh ref={ref} position={[0, y, 0]} renderOrder={3}>
      <torusGeometry args={[radius, tubeRadius, 8, 32]} />
      <meshBasicMaterial
        color={FOG_COLOR}
        transparent
        opacity={density}
        side={THREE.DoubleSide}
        depthWrite={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

export default function ProbabilityFogLayer({
  p10,
  p50,
  p90,
}: ProbabilityFogLayerProps) {
  const safeP50 = Math.max(1, p50)
  const dispersion = (p90 - p10) / safeP50

  const density = useMemo(() => dispersionToDensity(dispersion), [dispersion])

  // Generate fog ring layers — more layers = denser fog
  const rings = useMemo(() => {
    if (density < 0.02) return []

    const layers: Array<{
      y: number
      radius: number
      density: number
      tubeRadius: number
      speed: number
    }> = []

    // Base fog — widest, most opaque
    const numLayers = density > 0.2 ? 5 : density > 0.1 ? 3 : 2
    for (let i = 0; i < numLayers; i++) {
      const t = i / Math.max(1, numLayers - 1)
      const y = -1.8 + t * 4.5 // from base to mid-slope
      const radiusFade = 1 - t * 0.35 // narrower as we go up
      const opacityFade = 1 - t * 0.6 // lighter as we go up

      layers.push({
        y,
        radius: ISLAND_RADIUS * 0.6 * radiusFade,
        density: density * opacityFade,
        tubeRadius: 1.2 + (1 - t) * 1.5,
        speed: 0.02 + i * 0.008 * (i % 2 === 0 ? 1 : -1), // alternating drift
      })
    }

    return layers
  }, [density])

  if (rings.length === 0) return null

  return (
    <group>
      {rings.map((ring, i) => (
        <FogRing key={i} {...ring} />
      ))}
    </group>
  )
}
