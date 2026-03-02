// src/components/terrain/events/TerrainEventNode.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Event Node (God Mode)
//
// Structural intelligence marker embedded in terrain geometry.
// Micro-pillar with category-tinted emissive rim.
// Focus ring appears only on hover — no glow, no halo.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useState, useCallback, memo } from "react"
import * as THREE from "three"

// ── Category color map ──────────────────────────────────────────

const CATEGORY_COLORS: Record<TerrainEventNodeProps["category"], string> = {
  positive: "#2ECC71",
  info: "#00E5FF",
  strategic: "#6C5CE7",
  risk: "#FF4D4F",
}

// ── Constants ───────────────────────────────────────────────────

const PILLAR_RADIUS = 2.4  // ~4× prev — visible at camera distance
const MIN_HEIGHT = 6
const MAX_HEIGHT = 18
const RING_THICKNESS = 0.4
const RING_RADIUS_OFFSET = 1.6
const BASE_COLOR = "#0d1117" // dark titanium

// ── Types ───────────────────────────────────────────────────────

export type TerrainEventNodeProps = {
  /** World-space position [x, y, z] */
  position: [number, number, number]
  /** Importance factor 0–1, controls pillar height */
  importance: number
  /** Category determines accent color */
  category: "positive" | "info" | "strategic" | "risk"
  /** When true, show focus ring at base */
  isFocused?: boolean
  /** Unique event identifier */
  eventId?: string
  /** Called when focus state changes */
  onFocusChange?: (eventId: string | null) => void
}

// ── Component ───────────────────────────────────────────────────

const TerrainEventNode: React.FC<TerrainEventNodeProps> = memo(
  ({ position, importance, category, isFocused = false, eventId, onFocusChange }) => {
    const meshRef = useRef<THREE.Mesh>(null)
    const [hovered, setHovered] = useState(false)

    const height = MIN_HEIGHT + (MAX_HEIGHT - MIN_HEIGHT) * Math.max(0, Math.min(1, importance))
    const accentColor = CATEGORY_COLORS[category]
    const showRing = isFocused || hovered

    const handlePointerEnter = useCallback(
      (e: THREE.Event) => {
        ;(e as any).stopPropagation?.()
        setHovered(true)
        onFocusChange?.(eventId ?? null)
      },
      [eventId, onFocusChange],
    )

    const handlePointerLeave = useCallback(
      (e: THREE.Event) => {
        ;(e as any).stopPropagation?.()
        setHovered(false)
        onFocusChange?.(null)
      },
      [onFocusChange],
    )

    // Pillar sits with base at position.y, extends upward
    const pillarY = position[1] + height / 2

    return (
      <group position={[position[0], position[1], position[2]]}>
        {/* ── Pillar (micro-cylinder) ── */}
        <mesh
          ref={meshRef}
          position={[0, height / 2, 0]}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
        >
          <cylinderGeometry args={[PILLAR_RADIUS, PILLAR_RADIUS, height, 8]} />
          <meshStandardMaterial
            color={BASE_COLOR}
            emissive={accentColor}
            emissiveIntensity={hovered ? 0.65 : 0.35}
            metalness={0.6}
            roughness={0.35}
          />
        </mesh>

        {/* ── Pillar cap (bright disc at top) ── */}
        <mesh position={[0, height, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[PILLAR_RADIUS * 1.5, 12]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={0.6}
            metalness={0.4}
            roughness={0.25}
            transparent
            opacity={0.9}
          />
        </mesh>
        {/* ── Glow halo at base — always visible ── */}
        <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[PILLAR_RADIUS * 1.2, PILLAR_RADIUS * 2.5, 24]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={0.4}
            transparent
            opacity={0.45}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* ── Focus ring at base (visible only on hover/focus) ── */}
        {showRing && (
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry
              args={[
                PILLAR_RADIUS * RING_RADIUS_OFFSET,
                PILLAR_RADIUS * RING_RADIUS_OFFSET + RING_THICKNESS,
                24,
              ]}
            />
            <meshStandardMaterial
              color={accentColor}
              emissive={accentColor}
              emissiveIntensity={0.25}
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>
    )
  },
)

TerrainEventNode.displayName = "TerrainEventNode"
export default TerrainEventNode
