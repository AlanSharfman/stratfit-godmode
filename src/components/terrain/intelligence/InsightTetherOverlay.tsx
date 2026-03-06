// src/components/terrain/intelligence/InsightTetherOverlay.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Insight Tether Line (God Mode)
//
// Renders a subtle cyan SVG line between the primary-insight-anchor DOM
// element and the projected screen position of the terrain focus glow.
//
// RULES:
//   - No camera changes.
//   - No remount jitter.
//   - No independent RAF loop.
//   - Pure DOM overlay, not inside Canvas.
//   - Positioned relative to the terrain viewport container.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useCallback, useEffect, useRef, useState } from "react"
import * as THREE from "three"

export interface InsightTetherOverlayProps {
  /** World-space position of the terrain focus glow */
  focusWorldPosition: { x: number; y: number; z: number } | null
  /** Whether the tether should render */
  enabled: boolean
  /** Ref to the terrain viewport container (for relative positioning) */
  viewportRef: React.RefObject<HTMLDivElement>
}

// ── Screen coords type ──
interface ScreenPoint {
  x: number
  y: number
}

const ANCHOR_ID = "primary-insight-anchor"

export default function InsightTetherOverlay({
  focusWorldPosition,
  enabled,
  viewportRef,
}: InsightTetherOverlayProps) {
  const rafRef = useRef(0)
  const lineRef = useRef<SVGLineElement>(null)
  const circleRef = useRef<SVGCircleElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [visible, setVisible] = useState(false)

  // ── Projection: world → viewport-relative screen coords ──
  const projectToScreen = useCallback(
    (worldPos: { x: number; y: number; z: number }): ScreenPoint | null => {
      const viewport = viewportRef.current
      if (!viewport) return null

      // Find the R3F canvas inside the viewport
      const canvas = viewport.querySelector("canvas")
      if (!canvas) return null

      // Read camera matrices from the canvas __r3f state
      const r3fState = (canvas as any).__r3f
      if (!r3fState) return null
      const camera = r3fState.store?.getState()?.camera as THREE.PerspectiveCamera | undefined
      if (!camera) return null

      // Project
      const vec = new THREE.Vector3(worldPos.x, worldPos.y, worldPos.z)
      vec.project(camera)

      // Check if behind camera
      if (vec.z > 1) return null

      const rect = canvas.getBoundingClientRect()
      const vpRect = viewport.getBoundingClientRect()

      // Convert NDC to viewport-relative pixels
      const screenX = (vec.x * 0.5 + 0.5) * rect.width + (rect.left - vpRect.left)
      const screenY = (-vec.y * 0.5 + 0.5) * rect.height + (rect.top - vpRect.top)

      return { x: screenX, y: screenY }
    },
    [viewportRef],
  )

  // ── Get anchor element screen position (viewport-relative) ──
  const getAnchorPos = useCallback((): ScreenPoint | null => {
    const viewport = viewportRef.current
    if (!viewport) return null

    const anchor = document.getElementById(ANCHOR_ID)
    if (!anchor) return null

    const anchorRect = anchor.getBoundingClientRect()
    const vpRect = viewport.getBoundingClientRect()

    return {
      x: anchorRect.left + anchorRect.width / 2 - vpRect.left,
      y: anchorRect.top + anchorRect.height / 2 - vpRect.top,
    }
  }, [viewportRef])

  // ── Animation loop — uses single RAF, updates refs directly (no state churn) ──
  useEffect(() => {
    if (!enabled || !focusWorldPosition) {
      setVisible(false)
      return
    }

    let running = true

    function tick() {
      if (!running) return

      const line = lineRef.current
      const circle = circleRef.current
      const svg = svgRef.current
      if (!line || !svg) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const screen = projectToScreen(focusWorldPosition!)
      const anchorPt = getAnchorPos()

      if (screen && anchorPt) {
        line.setAttribute("x1", String(anchorPt.x))
        line.setAttribute("y1", String(anchorPt.y))
        line.setAttribute("x2", String(screen.x))
        line.setAttribute("y2", String(screen.y))
        if (circle) {
          circle.setAttribute("cx", String(screen.x))
          circle.setAttribute("cy", String(screen.y))
        }
        if (!visible) setVisible(true)
      } else {
        if (visible) setVisible(false)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    // Small delay to let anchor mount
    const startTimer = setTimeout(() => {
      rafRef.current = requestAnimationFrame(tick)
    }, 100)

    return () => {
      running = false
      clearTimeout(startTimer)
      cancelAnimationFrame(rafRef.current)
    }
  }, [enabled, focusWorldPosition, projectToScreen, getAnchorPos])

  if (!enabled || !focusWorldPosition) return null

  return (
    <svg
      ref={svgRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 3,
        overflow: "visible",
      }}
      aria-hidden="true"
    >
      <defs>
        <filter id="tether-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <line
        ref={lineRef}
        x1="0"
        y1="0"
        x2="0"
        y2="0"
        stroke="rgba(0,229,255,0.55)"
        strokeWidth="1.2"
        strokeDasharray="6 4"
        filter="url(#tether-glow)"
        style={{
          opacity: visible ? undefined : 0,
          animation: visible ? "tetherPulse 2.4s ease-in-out infinite" : "none",
        }}
      />
      {visible && (
        <circle
          ref={circleRef}
          cx="0"
          cy="0"
          r="3"
          fill="rgba(0,229,255,0.6)"
          style={{
            animation: "tetherPulse 2.4s ease-in-out infinite",
          }}
        />
      )}
      <style>{`
        @keyframes tetherPulse {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.75; }
        }
      `}</style>
    </svg>
  )
}
