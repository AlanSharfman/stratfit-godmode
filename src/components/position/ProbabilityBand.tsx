// src/components/position/ProbabilityBand.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Instrument-Grade Probability Band (Phase C+.1)
//
// Financial gauge, not a UI card. Receives precomputed values only.
// No math inside the component. Compact vertical footprint with
// soft P10–P90 bar, solid median tick, glow-bias delta, risk tint.
//
// Motion: fade + upward slide on mount (150ms), median shimmer every 6s.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useEffect, useRef, useState } from "react"
import { useUiFocusStore } from "@/store/uiFocusStore"

/* ── Types ─────────────────────────────────────────────────────── */

export type ProbabilityBandMetric = "revenue" | "risk" | "runway" | "valuation"

export interface ProbabilityBandProps {
  /** Metric label identifier */
  metric: ProbabilityBandMetric
  /** Human-readable label */
  label: string
  /** P10 value (low end) — precomputed */
  p10: number
  /** P50 / median value — precomputed */
  p50: number
  /** P90 value (high end) — precomputed */
  p90: number
  /** Scale min for gauge rendering — precomputed */
  scaleMin: number
  /** Scale max for gauge rendering — precomputed */
  scaleMax: number
  /** Delta from baseline (signed) — drives glow bias */
  delta?: number
  /** Display formatted median string */
  medianDisplay?: string
  /** Optional signal intensity 0–1 for spatial resonance */
  intensity?: number
}

/* ── Helpers ───────────────────────────────────────────────────── */

/** Normalize a value into 0–1 within [lo, hi] */
function norm(val: number, lo: number, hi: number): number {
  if (hi <= lo) return 0.5
  return Math.max(0, Math.min(1, (val - lo) / (hi - lo)))
}

/* ── Tick scale markers ────────────────────────────────────────── */

function scaleTicks(min: number, max: number, count: number): number[] {
  const ticks: number[] = []
  for (let i = 0; i <= count; i++) {
    ticks.push(min + (max - min) * (i / count))
  }
  return ticks
}

function formatTickLabel(val: number): string {
  const abs = Math.abs(val)
  if (abs >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(val / 1_000).toFixed(0)}k`
  if (abs < 1 && abs > 0) return val.toFixed(2)
  return val.toFixed(0)
}

/* ── Component ─────────────────────────────────────────────────── */

const ProbabilityBand: React.FC<ProbabilityBandProps> = memo(({
  metric,
  label,
  p10,
  p50,
  p90,
  scaleMin,
  scaleMax,
  delta = 0,
  medianDisplay,
  intensity = 0,
}) => {
  const [mounted, setMounted] = useState(false)
  const shimmerRef = useRef<HTMLDivElement>(null)
  const focusedMetric = useUiFocusStore((s) => s.focusedMetric)
  const setFocusedMetric = useUiFocusStore((s) => s.setFocusedMetric)

  // Mount animation trigger
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  // Shared-clock shimmer: 6s cycle via CSS animation (no per-component RAF)
  const isFocused = focusedMetric === metric
  const riskTint = p10 < 0

  // Positions as fractions along the gauge
  const p10Pos = norm(p10, scaleMin, scaleMax)
  const p50Pos = norm(p50, scaleMin, scaleMax)
  const p90Pos = norm(p90, scaleMin, scaleMax)

  // Glow bias: delta drives a soft glow shift, NOT an arrow
  const glowBias = delta > 0 ? 1 : delta < 0 ? -1 : 0
  const glowIntensity = Math.min(Math.abs(delta) * 2, 1)

  // Resonance boost when focused
  const resonanceOpacity = isFocused ? 0.12 : 0
  const baseOpacity = mounted ? 1 : 0

  const ticks = scaleTicks(scaleMin, scaleMax, 4)

  return (
    <div
      style={{
        position: "relative",
        padding: "6px 0",
        opacity: baseOpacity,
        transform: mounted ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 150ms ease-out, transform 150ms ease-out",
      }}
      onMouseEnter={() => setFocusedMetric(metric)}
      onMouseLeave={() => setFocusedMetric(null)}
    >
      {/* Resonance glow overlay */}
      {resonanceOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            inset: -2,
            borderRadius: 6,
            background: "rgba(34, 211, 238, 0.08)",
            boxShadow: "0 0 12px rgba(34, 211, 238, 0.06)",
            pointerEvents: "none",
            opacity: resonanceOpacity / 0.12,
            transition: "opacity 300ms ease",
          }}
        />
      )}

      {/* Label row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 3,
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
          {label}
        </span>
        {medianDisplay && (
          <span
            style={{
              fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(226, 240, 255, 0.9)",
            }}
          >
            {medianDisplay}
          </span>
        )}
      </div>

      {/* Gauge track */}
      <div
        style={{
          position: "relative",
          height: 18,
          background: "rgba(255, 255, 255, 0.03)",
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        {/* Grid scale ticks */}
        {ticks.map((tick, i) => {
          const pos = norm(tick, scaleMin, scaleMax) * 100
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${pos}%`,
                top: 0,
                bottom: 0,
                width: 1,
                background: "rgba(255, 255, 255, 0.06)",
                pointerEvents: "none",
              }}
            />
          )
        })}

        {/* P10–P90 translucent bar */}
        <div
          style={{
            position: "absolute",
            left: `${p10Pos * 100}%`,
            width: `${(p90Pos - p10Pos) * 100}%`,
            top: 3,
            bottom: 3,
            borderRadius: 2,
            background: riskTint
              ? "rgba(239, 68, 68, 0.18)"
              : "rgba(34, 211, 238, 0.15)",
            border: `1px solid ${
              riskTint
                ? "rgba(239, 68, 68, 0.25)"
                : "rgba(34, 211, 238, 0.2)"
            }`,
            transition: "background 300ms ease",
          }}
        />

        {/* Glow bias — soft directional glow on the band */}
        {glowBias !== 0 && glowIntensity > 0.05 && (
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: glowBias > 0 ? `${p50Pos * 100}%` : `${p10Pos * 100}%`,
              width: glowBias > 0
                ? `${(p90Pos - p50Pos) * 100}%`
                : `${(p50Pos - p10Pos) * 100}%`,
              background: glowBias > 0
                ? `linear-gradient(90deg, transparent, rgba(52, 211, 153, ${0.12 * glowIntensity}))`
                : `linear-gradient(270deg, transparent, rgba(239, 68, 68, ${0.12 * glowIntensity}))`,
              pointerEvents: "none",
              transition: "opacity 400ms ease",
            }}
          />
        )}

        {/* Median tick — solid vertical line */}
        <div
          ref={shimmerRef}
          style={{
            position: "absolute",
            left: `${p50Pos * 100}%`,
            top: 1,
            bottom: 1,
            width: 2,
            background: "rgba(226, 240, 255, 0.85)",
            borderRadius: 1,
            transform: "translateX(-1px)",
            boxShadow: "0 0 4px rgba(226, 240, 255, 0.3)",
          }}
          className="sf-median-shimmer"
        />
      </div>

      {/* Tick labels below gauge */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "2px 0 0",
        }}
      >
        {ticks.filter((_, i) => i === 0 || i === ticks.length - 1).map((tick, i) => (
          <span
            key={i}
            style={{
              fontFamily: "ui-monospace, 'JetBrains Mono', monospace",
              fontSize: 8,
              color: "rgba(148, 180, 214, 0.35)",
              letterSpacing: "0.04em",
            }}
          >
            {formatTickLabel(tick)}
          </span>
        ))}
      </div>

      {/* Shimmer keyframe — injected once, scoped via className */}
      <style>{`
        .sf-median-shimmer {
          animation: sfMedianShimmer 6s ease-in-out infinite;
        }
        @keyframes sfMedianShimmer {
          0%, 85%, 100% { opacity: 1; box-shadow: 0 0 4px rgba(226,240,255,0.3); }
          90% { opacity: 0.6; box-shadow: 0 0 8px rgba(34,211,238,0.4); }
          95% { opacity: 1; box-shadow: 0 0 6px rgba(226,240,255,0.5); }
        }
        @media (prefers-reduced-motion: reduce) {
          .sf-median-shimmer { animation: none; }
        }
      `}</style>
    </div>
  )
})

ProbabilityBand.displayName = "ProbabilityBand"
export default ProbabilityBand
