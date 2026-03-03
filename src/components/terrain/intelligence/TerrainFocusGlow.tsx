// src/components/terrain/intelligence/TerrainFocusGlow.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Focus Glow (Phase A10.1)
//
// Subtle radial glow anchored to the primary event's world position.
// Renders a soft ring + inner disc near the terrain surface.
//
// Rules:
//   - Opacity capped ≤ 0.35
//   - Pulse amplitude ≤ 8% using shared clock (useFrame)
//   - pointer-events none (Three.js: raycast = null)
//   - No camera movement
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useMemo, memo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface TerrainFocusGlowProps {
  position: { x: number; y: number; z: number } | null
  /** Signal intensity 0..1 — controls glow radius and brightness */
  intensity: number
  /** When false the glow is hidden */
  isActive: boolean
}

// ── Constants ───────────────────────────────────────────────────

const BASE_RADIUS = 18
const MAX_OPACITY = 0.35
const PULSE_AMP = 0.08 // ≤ 8%
const PULSE_FREQ = 0.6 // Hz — calm, institutional
const GLOW_COLOR = "#00e5ff" // cyan — matches terrain accent

// Shared geometry (avoid per-mount allocation)
const ringGeo = new THREE.RingGeometry(0.85, 1.0, 48)
const discGeo = new THREE.CircleGeometry(1, 48)

const TerrainFocusGlow: React.FC<TerrainFocusGlowProps> = memo(
  ({ position, intensity, isActive }) => {
    const groupRef = useRef<THREE.Group>(null)
    const ringMatRef = useRef<THREE.MeshStandardMaterial>(null)
    const discMatRef = useRef<THREE.MeshStandardMaterial>(null)

    const radius = BASE_RADIUS * (0.6 + 0.4 * intensity)
    const baseOpacity = Math.min(MAX_OPACITY, 0.12 + 0.23 * intensity)

    const ringMat = useMemo(
      () =>
        new THREE.MeshStandardMaterial({
          color: GLOW_COLOR,
          emissive: GLOW_COLOR,
          emissiveIntensity: 0.4 * intensity,
          transparent: true,
          opacity: baseOpacity,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      [intensity, baseOpacity],
    )

    const discMat = useMemo(
      () =>
        new THREE.MeshStandardMaterial({
          color: GLOW_COLOR,
          emissive: GLOW_COLOR,
          emissiveIntensity: 0.2 * intensity,
          transparent: true,
          opacity: baseOpacity * 0.35,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      [intensity, baseOpacity],
    )

    // Pulse animation — shared clock via useFrame
    useFrame((_, delta) => {
      if (!isActive || !groupRef.current) return
      const t = performance.now() * 0.001
      const pulse = 1 + Math.sin(t * Math.PI * 2 * PULSE_FREQ) * PULSE_AMP
      groupRef.current.scale.setScalar(radius * pulse)

      // Subtle opacity pulse
      if (ringMatRef.current) {
        ringMatRef.current.opacity = baseOpacity * (1 + Math.sin(t * Math.PI * 2 * PULSE_FREQ + 0.5) * PULSE_AMP * 0.5)
      }
      if (discMatRef.current) {
        discMatRef.current.opacity = baseOpacity * 0.35 * (1 + Math.sin(t * Math.PI * 2 * PULSE_FREQ + 0.5) * PULSE_AMP * 0.5)
      }
    })

    if (!isActive || !position) return null

    return (
      <group
        ref={groupRef}
        position={[position.x, position.y + 0.5, position.z]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[radius, radius, radius]}
        raycast={() => {}}
      >
        {/* Outer ring */}
        <mesh geometry={ringGeo} material={ringMat} ref={(m) => { if (m) ringMatRef.current = m.material as THREE.MeshStandardMaterial }}>
          <primitive object={ringMat} attach="material" ref={ringMatRef} />
        </mesh>
        {/* Inner disc (soft fill) */}
        <mesh geometry={discGeo} material={discMat}>
          <primitive object={discMat} attach="material" ref={discMatRef} />
        </mesh>
      </group>
    )
  },
)

TerrainFocusGlow.displayName = "TerrainFocusGlow"
export default TerrainFocusGlow
