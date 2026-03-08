// src/components/position/ExecutiveSummaryBar.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Executive Summary Bar (Phase C+.3 — Authoritative Mode)
//
// Tone-aware glass strip: Calm | Elevated | Critical.
// Deterministic tone from severity inputs. Left border accent.
// Max 120 chars. No "recommend", "should", "good/bad".
//
// Text: deterministic composition — leading clause = highest priority event,
// second clause = strongest delta movement.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useEffect, useState } from "react"

/* ── Types ─────────────────────────────────────────────────────── */

export type ToneLevel = "calm" | "elevated" | "critical"

export interface ExecutiveSummaryBarProps {
  /** Liquidity severity 0–1 */
  liquiditySeverity: number
  /** Risk severity 0–1 */
  riskSeverity: number
  /** Dispersion severity 0–1 */
  dispersionSeverity: number
  /** Highest priority event phrase (deterministic) */
  leadClause: string
  /** Strongest delta movement phrase (deterministic) */
  deltaClause: string
}

/* ── Tone logic (deterministic) ───────────────────────────────── */

function determineTone(
  liquidity: number,
  risk: number,
  dispersion: number,
): ToneLevel {
  if (liquidity >= 0.75 || risk >= 0.8) return "critical"
  if (risk >= 0.6 || dispersion >= 0.6) return "elevated"
  return "calm"
}

const TONE_CONFIG: Record<ToneLevel, {
  borderColor: string
  bgTint: string
  textColor: string
  label: string
}> = {
  calm: {
    borderColor: "rgba(52, 211, 153, 0.5)",
    bgTint: "rgba(52, 211, 153, 0.04)",
    textColor: "rgba(226, 240, 255, 0.72)",
    label: "STATUS NOMINAL",
  },
  elevated: {
    borderColor: "rgba(250, 204, 21, 0.5)",
    bgTint: "rgba(250, 204, 21, 0.04)",
    textColor: "rgba(226, 240, 255, 0.78)",
    label: "ELEVATED",
  },
  critical: {
    borderColor: "rgba(239, 68, 68, 0.5)",
    bgTint: "rgba(239, 68, 68, 0.05)",
    textColor: "rgba(226, 240, 255, 0.85)",
    label: "CRITICAL",
  },
}

/* ── Text composition ─────────────────────────────────────────── */

function composeSummary(lead: string, delta: string): string {
  if (!lead && !delta) return "Scenario parameters within baseline tolerances."
  const parts: string[] = []
  if (lead) parts.push(lead)
  if (delta) parts.push(delta)
  const raw = parts.join("; ") + "."
  // Enforce max 120 chars
  if (raw.length > 120) return raw.slice(0, 117) + "…"
  return raw
}

/* ── Component ─────────────────────────────────────────────────── */

const ExecutiveSummaryBar: React.FC<ExecutiveSummaryBarProps> = memo(({
  liquiditySeverity,
  riskSeverity,
  dispersionSeverity,
  leadClause,
  deltaClause,
}) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const tone = determineTone(liquiditySeverity, riskSeverity, dispersionSeverity)
  const config = TONE_CONFIG[tone]
  const summaryText = composeSummary(leadClause, deltaClause)

  return (
    <div
      style={{
        width: "100%",
        position: "relative",
        padding: "7px 14px 7px 16px",
        background: `linear-gradient(90deg, ${config.bgTint}, rgba(6, 12, 20, 0.5))`,
        backdropFilter: "blur(12px) saturate(1.05)",
        WebkitBackdropFilter: "blur(12px) saturate(1.05)",
        borderLeft: `3px solid ${config.borderColor}`,
        borderRadius: "0 4px 4px 0",
        display: "flex",
        alignItems: "center",
        gap: 10,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(-4px)",
        transition: "opacity 200ms ease-out, transform 200ms ease-out, border-color 400ms ease, background 400ms ease",
        overflow: "hidden",
      }}
    >
      {/* Tone indicator dot */}
      <div
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: config.borderColor,
          flexShrink: 0,
          boxShadow: `0 0 6px ${config.borderColor}`,
          opacity: 0.3,
        }}
      />

      {/* Tone label */}
      <span
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: config.borderColor,
          flexShrink: 0,
          minWidth: 52,
          opacity: 0.3,
        }}
      >
        {config.label}
      </span>

      {/* Summary text */}
      <span
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 11,
          fontWeight: 400,
          color: config.textColor,
          lineHeight: 1.4,
          letterSpacing: "0.01em",
          flex: 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {summaryText}
      </span>
    </div>
  )
})

ExecutiveSummaryBar.displayName = "ExecutiveSummaryBar"
export default ExecutiveSummaryBar
