// src/components/mountain/EVHeatLayer.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — EV Heat Gradient Overlay (God Mode only)
//
// Semi-transparent colour gradient over the terrain mesh that visualises
// enterprise-value delta relative to baseline.
//
// Colour mapping (valueDelta):
//   > +25%  →  Emerald   #34d399
//   > +10%  →  Cyan      #22d3ee
//     0%    →  Slate     #475569
//   < -10%  →  Violet    #a78bfa
//   < -25%  →  Red       #f87171
//
// Renders as a flat gradient plane at terrain base level.
// Max opacity 0.25. R3F component — must be inside Canvas.
//
// DO NOT import outside ScenarioMountainImpl god mode block.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"

// ── Terrain constants (mirrored from ScenarioMountainImpl) ──
const MESH_W = 50
const MESH_D = 25
const ISLAND_RADIUS = 22

export interface EVHeatLayerProps {
  /** Scenario enterprise value (median / P50) */
  enterpriseValueMedian: number
  /** Baseline enterprise value for delta comparison */
  baselineEV: number
}

/* ── Colour stops mapped to delta % ── */
const HEAT_STOPS: { threshold: number; color: THREE.Color }[] = [
  { threshold: 0.25, color: new THREE.Color("#34d399") },  // Emerald
  { threshold: 0.10, color: new THREE.Color("#22d3ee") },  // Cyan
  { threshold: 0.00, color: new THREE.Color("#475569") },  // Neutral Slate
  { threshold: -0.10, color: new THREE.Color("#a78bfa") }, // Violet
  { threshold: -0.25, color: new THREE.Color("#f87171") }, // Red
]

function deltaToColor(delta: number): THREE.Color {
  // Clamp delta to [-0.5, 0.5]
  const d = Math.max(-0.5, Math.min(0.5, delta))

  // Walk stops from top (most positive) to bottom
  for (let i = 0; i < HEAT_STOPS.length - 1; i++) {
    const upper = HEAT_STOPS[i]
    const lower = HEAT_STOPS[i + 1]
    if (d >= lower.threshold) {
      const t = (d - lower.threshold) / Math.max(0.001, upper.threshold - lower.threshold)
      return new THREE.Color().lerpColors(lower.color, upper.color, Math.min(1, Math.max(0, t)))
    }
  }
  return HEAT_STOPS[HEAT_STOPS.length - 1].color.clone()
}

function deltaToOpacity(delta: number): number {
  // Stronger delta → higher opacity, max 0.25
  const magnitude = Math.min(1, Math.abs(delta) / 0.4)
  return 0.06 + magnitude * 0.19 // range: 0.06 – 0.25
}

export default function EVHeatLayer({
  enterpriseValueMedian,
  baselineEV,
}: EVHeatLayerProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  const valueDelta = baselineEV > 0
    ? (enterpriseValueMedian - baselineEV) / baselineEV
    : 0

  const heatColor = useMemo(() => deltaToColor(valueDelta), [valueDelta])
  const targetOpacity = useMemo(() => deltaToOpacity(valueDelta), [valueDelta])

  // Geometry: circular gradient disc matching island footprint
  const geometry = useMemo(() => {
    const segments = 64
    const geo = new THREE.CircleGeometry(ISLAND_RADIUS * 0.85, segments)

    // Apply radial fade via vertex colours
    const pos = geo.attributes.position
    const colors = new Float32Array(pos.count * 3)
    const center = new THREE.Vector2(0, 0)

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const dist = center.distanceTo(new THREE.Vector2(x, y))
      const fade = 1 - Math.pow(dist / (ISLAND_RADIUS * 0.85), 1.8)
      const f = Math.max(0, fade)
      colors[i * 3] = heatColor.r * f
      colors[i * 3 + 1] = heatColor.g * f
      colors[i * 3 + 2] = heatColor.b * f
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3))
    return geo
  }, [heatColor])

  // Gentle pulse animation
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(({ clock }) => {
    if (materialRef.current) {
      const pulse = Math.sin(clock.elapsedTime * 0.8) * 0.03
      materialRef.current.opacity = Math.max(0.04, targetOpacity + pulse)
    }
  })

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -1.95, 0]}
      renderOrder={5}
    >
      <circleGeometry args={[ISLAND_RADIUS * 0.85, 64]} />
      <meshBasicMaterial
        ref={materialRef}
        vertexColors
        transparent
        opacity={targetOpacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
