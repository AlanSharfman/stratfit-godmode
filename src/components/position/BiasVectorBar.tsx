// src/components/position/BiasVectorBar.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Bias Vector Bar (Phase C+.2)
//
// Replaces badge-style bias indicator. Horizontal bar with center neutral
// marker, glow drift toward bias direction. Deterministic scoring:
//   score = (revenueDelta * 0.6) - (riskDelta * 0.3) - (dispersionDelta * 0.1)
//
// Labels: CONSTRUCTIVE | DETERIORATING | UNSTABLE | NEUTRAL
// Motion: Very slow clock-based drift. No bounce. No flash.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useEffect, useRef, useState } from "react"

/* ── Types ─────────────────────────────────────────────────────── */

export interface BiasVectorBarProps {
  /** Revenue delta vs baseline (-1…+1 normalized) */
  revenueDelta: number
  /** Risk delta vs baseline (-1…+1 normalized) */
  riskDelta: number
  /** Dispersion delta vs baseline (0…1 normalized) */
  dispersionDelta: number
}

/* ── Bias classification ──────────────────────────────────────── */

type BiasLabel = "CONSTRUCTIVE" | "DETERIORATING" | "UNSTABLE" | "NEUTRAL"

interface BiasState {
  label: BiasLabel
  score: number        // -1…+1
  color: string        // accent color
  glowColor: string    // glow tint
}

const UNSTABLE_THRESHOLD = 0.35

function classifyBias(
  revenueDelta: number,
  riskDelta: number,
  dispersionDelta: number,
): BiasState {
  // Deterministic score
  const raw = (revenueDelta * 0.6) - (riskDelta * 0.3) - (dispersionDelta * 0.1)
  const score = Math.max(-1, Math.min(1, raw))

  // Unstable override
  if (dispersionDelta > UNSTABLE_THRESHOLD) {
    return {
      label: "UNSTABLE",
      score,
      color: "rgba(167, 139, 250, 0.9)",    // Violet
      glowColor: "rgba(167, 139, 250, 0.25)",
    }
  }

  if (score > 0.12) {
    return {
      label: "CONSTRUCTIVE",
      score,
      color: "rgba(52, 211, 153, 0.9)",     // Emerald
      glowColor: "rgba(52, 211, 153, 0.2)",
    }
  }

  if (score < -0.12) {
    return {
      label: "DETERIORATING",
      score,
      color: "rgba(239, 68, 68, 0.9)",      // Red
      glowColor: "rgba(239, 68, 68, 0.2)",
    }
  }

  return {
    label: "NEUTRAL",
    score,
    color: "rgba(148, 163, 184, 0.7)",       // Charcoal / slate
    glowColor: "rgba(148, 163, 184, 0.1)",
  }
}

/* ── Component ─────────────────────────────────────────────────── */

const BiasVectorBar: React.FC<BiasVectorBarProps> = memo(({
  revenueDelta,
  riskDelta,
  dispersionDelta,
}) => {
  const [mounted, setMounted] = useState(false)
  const driftRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const [driftOffset, setDriftOffset] = useState(0)

  const bias = classifyBias(revenueDelta, riskDelta, dispersionDelta)

  // Mount animation
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  // Very slow drift toward bias direction — single shared RAF
  useEffect(() => {
    let running = true
    const targetPx = bias.score * 40 // max ±40px drift
    const DRIFT_SPEED = 0.3 // px per frame at 60fps

    function tick() {
      if (!running) return
      const diff = targetPx - driftRef.current
      if (Math.abs(diff) > 0.1) {
        driftRef.current += Math.sign(diff) * Math.min(Math.abs(diff), DRIFT_SPEED)
        setDriftOffset(driftRef.current)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      running = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [bias.score])

  // Glow position: center (50%) + drift
  const glowLeftPct = 50 + (driftOffset / 1.6) // scaled to percentage

  return (
    <div
      style={{
        position: "relative",
        padding: "6px 0",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 150ms ease-out, transform 150ms ease-out",
      }}
    >
      {/* Label */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 4,
          padding: "0 2px",
        }}
      >
        <span
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(148, 180, 214, 0.7)",
          }}
        >
          BIAS
        </span>
        <span
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: bias.color,
            transition: "color 600ms ease",
          }}
        >
          {bias.label}
        </span>
      </div>

      {/* Horizontal bar */}
      <div
        style={{
          position: "relative",
          height: 8,
          background: "rgba(255, 255, 255, 0.03)",
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        {/* Center neutral marker */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: 1,
            background: "rgba(255, 255, 255, 0.15)",
            transform: "translateX(-0.5px)",
          }}
        />

        {/* Glow drift blob */}
        <div
          style={{
            position: "absolute",
            top: -2,
            bottom: -2,
            left: `${glowLeftPct}%`,
            width: 32,
            transform: "translateX(-16px)",
            background: `radial-gradient(ellipse at center, ${bias.glowColor}, transparent 70%)`,
            transition: "background 600ms ease",
            pointerEvents: "none",
          }}
        />

        {/* Score position indicator */}
        <div
          style={{
            position: "absolute",
            left: `${50 + bias.score * 45}%`,
            top: 1,
            bottom: 1,
            width: 3,
            borderRadius: 1.5,
            background: bias.color,
            transform: "translateX(-1.5px)",
            transition: "left 800ms cubic-bezier(0.22, 1, 0.36, 1), background 600ms ease",
            boxShadow: `0 0 6px ${bias.glowColor}`,
          }}
        />
      </div>
    </div>
  )
})

BiasVectorBar.displayName = "BiasVectorBar"
export default BiasVectorBar
