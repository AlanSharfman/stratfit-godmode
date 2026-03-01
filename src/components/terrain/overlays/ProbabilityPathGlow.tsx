// src/components/terrain/overlays/ProbabilityPathGlow.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Probability Path Glow overlay
//
// Renders a soft additive-blended glow tube along the P50 trajectory.
// Projected onto the terrain surface using terrainRef.getHeightAt().
//
// Key constraints:
//   - No per-frame allocations. Geometry memoized on path change.
//   - Additive blending for soft feathered look.
//   - Palette: ice/cyan primary.
//   - Gated by `enabled` prop.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import type { Vec3 } from "@/selectors/probabilitySelectors"

interface Props {
  /** P50 path points in terrain world-space (y=0, needs height projection) */
  p50Path: Vec3[]
  /** Glow intensity 0..1 */
  intensity: number
  /** Master enable flag */
  enabled: boolean
  /** Terrain surface for height sampling */
  terrainRef: React.RefObject<{ getHeightAt: (x: number, z: number) => number }>
  /** Hover offset above terrain surface */
  hoverOffset?: number
}

/** Inner line color — bright cyan */
const CORE_COLOR = new THREE.Color("#22d3ee")
/** Outer glow color — softer ice */
const GLOW_COLOR = new THREE.Color("#67e8f9")

export default function ProbabilityPathGlow({
  p50Path,
  intensity,
  enabled,
  terrainRef,
  hoverOffset = 0.9,
}: Props) {
  const coreRef = useRef<THREE.Line>(null)
  const glowRef = useRef<THREE.Line>(null)

  // Project path onto terrain surface + memoize geometry
  const { coreGeo, glowGeo } = useMemo(() => {
    if (!p50Path.length || !terrainRef.current) {
      return { coreGeo: null, glowGeo: null }
    }

    const terrain = terrainRef.current
    const projected = p50Path.map((p) => {
      const y = terrain.getHeightAt(p.x, p.z) + hoverOffset
      return new THREE.Vector3(p.x, y, p.z)
    })

    const core = new THREE.BufferGeometry().setFromPoints(projected)

    // Glow layer — slightly elevated for depth separation
    const glowProjected = projected.map(
      (v) => new THREE.Vector3(v.x, v.y + 0.15, v.z),
    )
    const glow = new THREE.BufferGeometry().setFromPoints(glowProjected)

    return { coreGeo: core, glowGeo: glow }
  }, [p50Path, terrainRef, hoverOffset])

  // Animate opacity based on intensity — no allocations
  // When cinematic sync is enabled, derive intensity from reveal phase
  useFrame(() => {
    const effectiveIntensity = intensity

    if (coreRef.current) {
      const mat = coreRef.current.material as THREE.LineBasicMaterial
      mat.opacity = effectiveIntensity * 0.92
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.LineBasicMaterial
      mat.opacity = effectiveIntensity * 0.38
    }
  })

  if (!enabled || !coreGeo || !glowGeo) return null

  return (
    <group>
      {/* Core line — bright cyan, additive */}
      <line ref={coreRef as any}>
        <bufferGeometry attach="geometry" {...coreGeo} />
        <lineBasicMaterial
          attach="material"
          color={CORE_COLOR}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          linewidth={1}
        />
      </line>

      {/* Outer glow — softer, wider apparent spread via additive */}
      <line ref={glowRef as any}>
        <bufferGeometry attach="geometry" {...glowGeo} />
        <lineBasicMaterial
          attach="material"
          color={GLOW_COLOR}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          linewidth={1}
        />
      </line>
    </group>
  )
}
