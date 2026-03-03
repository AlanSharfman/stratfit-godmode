// src/features/intelligence/LightingModulator.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Lighting Modulation Layer (Executive Briefing)
//
// Modulates global scene lighting during briefing playback.
// Uses screen-space vignette overlay + R3F light ref adjustments.
// DOES NOT modify mesh shaders or terrain geometry.
//
// Mount as a sibling OUTSIDE the R3F Canvas — uses a CSS overlay.
// For in-canvas light changes, mount <LightingModulatorR3F /> inside Canvas.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useMemo } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { useRef, useEffect } from "react"
import * as THREE from "three"

/* ═══════════════════════════════════════════════════════════════
   PART A — Screen-space vignette overlay (DOM layer)
   ═══════════════════════════════════════════════════════════════ */

export interface LightingModulatorOverlayProps {
  /** Whether briefing is active */
  active: boolean
  /** Transition progress 0..1 (for enter/exit fades) */
  progress: number
}

export const LightingModulatorOverlay: React.FC<LightingModulatorOverlayProps> =
  memo(({ active, progress }) => {
    if (!active && progress <= 0) return null

    const opacity = easeInOutCubic(progress) * 0.05 // subtle 5% max

    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 15,
          background: `radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,${opacity * 6}) 100%)`,
          opacity: Math.min(progress, 1),
          transition: active ? "none" : "opacity 600ms ease-out",
        }}
        aria-hidden
      />
    )
  })

LightingModulatorOverlay.displayName = "LightingModulatorOverlay"

/* ═══════════════════════════════════════════════════════════════
   PART B — R3F in-canvas light modulation
   Must mount INSIDE a <Canvas> / R3F context.
   ═══════════════════════════════════════════════════════════════ */

export interface LightingModulatorR3FProps {
  /** Whether briefing is active */
  active: boolean
  /** Transition progress 0..1 */
  progress: number
}

/**
 * Modulates existing scene lights during briefing.
 * - Reduces ambient by ~12%
 * - Boosts directional key intensity by ~8%
 * - Adds subtle emissive boost via tone mapping exposure
 */
export const LightingModulatorR3F: React.FC<LightingModulatorR3FProps> = memo(
  ({ active, progress }) => {
    const { scene, gl } = useThree()

    // Store original light intensities on first activation
    const originalsRef = useRef<Map<string, number>>(new Map())
    const savedExposureRef = useRef(1.0)
    const capturedRef = useRef(false)

    useEffect(() => {
      if (active && !capturedRef.current) {
        // Capture original values
        savedExposureRef.current = gl.toneMappingExposure
        scene.traverse((obj) => {
          if (obj instanceof THREE.AmbientLight) {
            originalsRef.current.set(obj.uuid + "_ambient", obj.intensity)
          }
          if (obj instanceof THREE.DirectionalLight) {
            originalsRef.current.set(obj.uuid + "_dir", obj.intensity)
          }
        })
        capturedRef.current = true
      }
      if (!active && capturedRef.current) {
        // Restore originals
        scene.traverse((obj) => {
          if (obj instanceof THREE.AmbientLight) {
            const orig = originalsRef.current.get(obj.uuid + "_ambient")
            if (orig !== undefined) obj.intensity = orig
          }
          if (obj instanceof THREE.DirectionalLight) {
            const orig = originalsRef.current.get(obj.uuid + "_dir")
            if (orig !== undefined) obj.intensity = orig
          }
        })
        gl.toneMappingExposure = savedExposureRef.current
        capturedRef.current = false
        originalsRef.current.clear()
      }
    }, [active, scene, gl])

    useFrame(() => {
      if (!active || !capturedRef.current) return

      const t = easeInOutCubic(progress)

      scene.traverse((obj) => {
        if (obj instanceof THREE.AmbientLight) {
          const orig =
            originalsRef.current.get(obj.uuid + "_ambient") ?? obj.intensity
          // Reduce ambient by 12%
          obj.intensity = orig * (1 - 0.12 * t)
        }
        if (obj instanceof THREE.DirectionalLight) {
          const orig =
            originalsRef.current.get(obj.uuid + "_dir") ?? obj.intensity
          // Boost key light by 8%
          obj.intensity = orig * (1 + 0.08 * t)
        }
      })

      // Boost exposure by 10% for subtle emissive lift
      gl.toneMappingExposure = savedExposureRef.current * (1 + 0.1 * t)
    })

    return null
  },
)

LightingModulatorR3F.displayName = "LightingModulatorR3F"

/* ── Easing ── */

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
