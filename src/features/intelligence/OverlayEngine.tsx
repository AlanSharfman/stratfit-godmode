// src/features/intelligence/OverlayEngine.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Overlay Discipline Engine (Executive Briefing)
//
// Controls overlay visibility during briefing with strict discipline:
//   - Max 2 overlays visible at any time
//   - Max 1 pulse animation
//   - Max 1 label
//   - Fade in 400ms, hold, fade out 300ms
//
// Supported overlay types:
//   pin_pulse, zone_mask, heat_wash, delta_ribbon, contour_glow
//
// Renders inside R3F Canvas. No DOM spam. Mesh-based overlays only.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

/* ── Types ── */

export type OverlayType =
  | "pin_pulse"
  | "zone_mask"
  | "heat_wash"
  | "delta_ribbon"
  | "contour_glow"

export interface OverlayEvent {
  id: string
  type: OverlayType
  /** Start time in ms from briefing start */
  startMs: number
  /** Duration visible in ms */
  durationMs: number
  /** World position (x, z) on terrain */
  position: [number, number]
  /** Color (hex) */
  color: number
  /** Optional label text (max 1 visible at a time) */
  label?: string
  /** Size/radius */
  radius?: number
}

export interface OverlayEngineProps {
  active: boolean
  events: OverlayEvent[]
  nowMs: number
}

/* ── Timing constants ── */

const FADE_IN_MS = 400
const FADE_OUT_MS = 300

/* ── Active overlay state ── */

interface ActiveOverlay {
  event: OverlayEvent
  opacity: number
  phase: "fadeIn" | "hold" | "fadeOut" | "done"
}

/* ── Colors ── */

const OVERLAY_COLORS: Record<OverlayType, number> = {
  pin_pulse: 0x22d3ee, // cyan
  zone_mask: 0x818cf8, // indigo
  heat_wash: 0xef4444, // red risk
  delta_ribbon: 0x34d399, // emerald
  contour_glow: 0x22d3ee, // cyan
}

/* ── Component ── */

const OverlayEngine: React.FC<OverlayEngineProps> = memo(
  ({ active, events, nowMs }) => {
    const overlaysRef = useRef<ActiveOverlay[]>([])
    const groupRef = useRef<THREE.Group>(null)

    // Determine which events are currently active given nowMs
    const currentEvents = useMemo(() => {
      if (!active) return []
      return events.filter(
        (e) => nowMs >= e.startMs && nowMs < e.startMs + e.durationMs + FADE_OUT_MS,
      )
    }, [active, events, nowMs])

    // Enforce discipline: max 2 overlays, max 1 pulse, max 1 label
    const disciplined = useMemo(() => {
      const sorted = [...currentEvents].sort((a, b) => a.startMs - b.startMs)
      const result: OverlayEvent[] = []
      let pulseCount = 0
      let labelCount = 0

      for (const e of sorted) {
        if (result.length >= 2) break
        if (e.type === "pin_pulse") {
          if (pulseCount >= 1) continue
          pulseCount++
        }
        if (e.label) {
          if (labelCount >= 1) continue
          labelCount++
        }
        result.push(e)
      }

      return result
    }, [currentEvents])

    useFrame(() => {
      if (!active || !groupRef.current) return

      // Update active overlays
      overlaysRef.current = disciplined.map((event) => {
        const elapsed = nowMs - event.startMs
        const totalHold = event.durationMs - FADE_IN_MS

        let opacity: number
        let phase: ActiveOverlay["phase"]

        if (elapsed < FADE_IN_MS) {
          phase = "fadeIn"
          opacity = easeOutCubic(elapsed / FADE_IN_MS)
        } else if (elapsed < event.durationMs) {
          phase = "hold"
          opacity = 1
        } else if (elapsed < event.durationMs + FADE_OUT_MS) {
          phase = "fadeOut"
          opacity = 1 - easeOutCubic((elapsed - event.durationMs) / FADE_OUT_MS)
        } else {
          phase = "done"
          opacity = 0
        }

        return { event, opacity, phase }
      })

      // Update children visibility/opacity
      const children = groupRef.current.children
      for (let i = 0; i < children.length; i++) {
        const overlay = overlaysRef.current[i]
        if (!overlay) {
          children[i].visible = false
          continue
        }

        children[i].visible = overlay.opacity > 0.01

        // Update material opacity
        const mesh = children[i] as THREE.Mesh
        if (mesh.material instanceof THREE.MeshBasicMaterial) {
          mesh.material.opacity = overlay.opacity * 0.6
        }

        // Pulse animation for pin_pulse type
        if (overlay.event.type === "pin_pulse" && overlay.phase === "hold") {
          const pulseT = Math.sin(nowMs * 0.003) * 0.15 + 1
          children[i].scale.setScalar(pulseT)
        } else {
          children[i].scale.setScalar(1)
        }
      }
    })

    if (!active) return null

    return (
      <group ref={groupRef} name="overlay-engine">
        {disciplined.map((event, i) => (
          <OverlayMesh key={event.id} event={event} />
        ))}
      </group>
    )
  },
)

OverlayEngine.displayName = "OverlayEngine"
export default OverlayEngine

/* ── Individual overlay mesh ── */

const OverlayMesh: React.FC<{ event: OverlayEvent }> = memo(({ event }) => {
  const radius = event.radius ?? 15
  const y = 5 // slightly above terrain
  const color = event.color || OVERLAY_COLORS[event.type] || 0x22d3ee

  switch (event.type) {
    case "pin_pulse":
      return (
        <mesh
          position={[event.position[0], y, event.position[1]]}
          renderOrder={25}
        >
          <sphereGeometry args={[radius * 0.3, 16, 12]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.6}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )

    case "zone_mask":
      return (
        <mesh
          position={[event.position[0], y - 3, event.position[1]]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={22}
        >
          <circleGeometry args={[radius, 48]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.6}
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      )

    case "heat_wash":
      return (
        <mesh
          position={[event.position[0], y - 2, event.position[1]]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={21}
        >
          <circleGeometry args={[radius * 1.5, 48]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.6}
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      )

    case "delta_ribbon":
      return (
        <mesh
          position={[event.position[0], y, event.position[1]]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={23}
        >
          <ringGeometry args={[radius * 0.8, radius, 48]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.6}
            depthWrite={false}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      )

    case "contour_glow":
      return (
        <mesh
          position={[event.position[0], y + 1, event.position[1]]}
          renderOrder={24}
        >
          <torusGeometry args={[radius, radius * 0.08, 8, 48]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.6}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )

    default:
      return null
  }
})

/* ── Easing ── */

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
