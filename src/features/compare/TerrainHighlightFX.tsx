// src/features/compare/TerrainHighlightFX.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Terrain Highlight FX (Compare Insight Linking)
//
// Renders a one-shot "terrain pin + ripple ring" at a world position
// inside the TerrainStage Canvas. Triggered when an insight item is
// hovered/clicked.  Fades in → holds → fades out. No persist.
//
// Option B (marker+pulse only; no ray). TODO: ray linking from insight
// panel anchor to target if desired later.
//
// Mount inside <TerrainStage> children — NOT standalone Canvas.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import { Line as DreiLine } from "@react-three/drei"
import type { HighlightTarget } from "./highlightContract"
import { resolveTargetXZ } from "./highlightContract"

export interface TerrainHighlightFXProps {
  /** Active highlight target — change triggers one-shot FX */
  active?: HighlightTarget
  enabled?: boolean
  /** Fade-in/out duration (ms) */
  fadeMs?: number
  /** Hold duration at full opacity (ms) */
  holdMs?: number
  /** Whether to pulse during hold */
  pulse?: boolean
  /** Timestamp of last trigger — change forces re-fire */
  triggerTs?: number
  /** If true, render a downbeam ray from rayOriginY to the marker */
  rayEnabled?: boolean
  /** World-space Y elevation where the ray beam starts (default: 60) */
  rayOriginY?: number
}

const CYAN_COLOR = new THREE.Color(0x22d3ee)
const RING_COLOR = new THREE.Color(0x22d3ee)

export default function TerrainHighlightFX({
  active,
  enabled = true,
  fadeMs = 400,
  holdMs = 1800,
  pulse = true,
  triggerTs,
  rayEnabled = false,
  rayOriginY = 60,
}: TerrainHighlightFXProps) {
  const pinRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.PointLight>(null)
  const rayRef = useRef<any>(null)
  const phaseRef = useRef<"idle" | "fadeIn" | "hold" | "fadeOut">("idle")
  const timerRef = useRef(0)
  const opacityRef = useRef(0)
  const ringScaleRef = useRef(1)

  // Resolve position
  const pos = useMemo(() => {
    if (!active) return null
    return resolveTargetXZ(active)
  }, [active])

  // Re-trigger on active/ts change
  useEffect(() => {
    if (!active || !enabled) {
      phaseRef.current = "idle"
      opacityRef.current = 0
      return
    }
    phaseRef.current = "fadeIn"
    timerRef.current = 0
    ringScaleRef.current = 1
  }, [active, enabled, triggerTs])

  // Animation loop
  useFrame((_, delta) => {
    const dt = delta * 1000
    const phase = phaseRef.current
    if (phase === "idle") {
      if (opacityRef.current > 0) opacityRef.current = 0
      applyVisuals(0, 1)
      return
    }

    timerRef.current += dt

    if (phase === "fadeIn") {
      const t = Math.min(timerRef.current / fadeMs, 1)
      opacityRef.current = easeOutCubic(t)
      if (t >= 1) {
        phaseRef.current = "hold"
        timerRef.current = 0
      }
    } else if (phase === "hold") {
      opacityRef.current = pulse
        ? 0.7 + 0.3 * Math.sin(timerRef.current * 0.004)
        : 1
      ringScaleRef.current = 1 + (timerRef.current / holdMs) * 2.5
      if (timerRef.current >= holdMs) {
        phaseRef.current = "fadeOut"
        timerRef.current = 0
      }
    } else if (phase === "fadeOut") {
      const t = Math.min(timerRef.current / fadeMs, 1)
      opacityRef.current = 1 - easeOutCubic(t)
      if (t >= 1) {
        phaseRef.current = "idle"
        opacityRef.current = 0
      }
    }

    applyVisuals(opacityRef.current, ringScaleRef.current)
  })

  function applyVisuals(opacity: number, ringScale: number) {
    if (pinRef.current) {
      const mat = pinRef.current.material as THREE.MeshStandardMaterial
      mat.opacity = opacity * 0.85
      mat.emissiveIntensity = opacity * 2.0
      pinRef.current.visible = opacity > 0.01
    }
    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = opacity * 0.35
      ringRef.current.scale.setScalar(ringScale)
      ringRef.current.visible = opacity > 0.01
    }
    if (glowRef.current) {
      glowRef.current.intensity = opacity * 3.0
      glowRef.current.visible = opacity > 0.01
    }
    if (rayRef.current) {
      // DreiLine exposes material via .material on the underlying Line2 object
      const mat = rayRef.current?.material
      if (mat) mat.opacity = opacity * 0.45
      if (rayRef.current) rayRef.current.visible = opacity > 0.01
    }
  }

  // Y position: place slightly above the terrain surface
  const y = 4

  // Ray beam points: from high above down to the marker
  const rayPoints = useMemo(():
    [[number, number, number], [number, number, number]] =>
    [[0, rayOriginY - y, 0], [0, 0, 0]],
    [rayOriginY, y]
  )

  if (!pos || !enabled) return null

  return (
    <group position={[pos.x, y, pos.z]} name="terrain-highlight-fx">
      {/* ── Downbeam ray from panel anchor to terrain marker ── */}
      {rayEnabled && (
        <DreiLine
          ref={rayRef}
          points={rayPoints}
          color="#22d3ee"
          lineWidth={1.2}
          transparent
          opacity={0}
          depthWrite={false}
          dashed
          dashScale={4}
          dashSize={2}
          gapSize={1.5}
        />
      )}
      {/* ── Pin marker ── */}
      <mesh ref={pinRef} renderOrder={20}>
        <sphereGeometry args={[2.5, 16, 12]} />
        <meshStandardMaterial
          color={CYAN_COLOR}
          emissive={CYAN_COLOR}
          emissiveIntensity={2.0}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* ── Ripple ring (flat, expanding) ── */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -3, 0]}
        renderOrder={19}
      >
        <ringGeometry args={[8, 10, 48]} />
        <meshBasicMaterial
          color={RING_COLOR}
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* ── Point light glow ── */}
      <pointLight
        ref={glowRef}
        color={CYAN_COLOR}
        intensity={0}
        distance={80}
        decay={2}
      />
    </group>
  )
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}
