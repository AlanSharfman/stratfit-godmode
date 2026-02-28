// src/components/insight/ProbabilitySignalCard.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Probability Signal Card
//
// Standalone card rendering a single probability signal with:
//   title · probability % · impact level · short interpretation
//
// Used inside the Executive Interpretation panel or as a standalone widget.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo } from "react"
import type { ProbabilitySignal } from "@/engine/aiInsightBuilder"

function impactColor(level: ProbabilitySignal["impactLevel"]): {
  bg: string
  fg: string
  border: string
} {
  if (level === "high")
    return {
      bg: "rgba(239,68,68,0.12)",
      fg: "rgba(239,68,68,0.85)",
      border: "rgba(239,68,68,0.22)",
    }
  if (level === "medium")
    return {
      bg: "rgba(251,191,36,0.10)",
      fg: "rgba(251,191,36,0.85)",
      border: "rgba(251,191,36,0.20)",
    }
  return {
    bg: "rgba(52,211,153,0.10)",
    fg: "rgba(52,211,153,0.8)",
    border: "rgba(52,211,153,0.18)",
  }
}

function probabilityColor(p: number): string {
  if (p >= 80) return "rgba(52,211,153,0.9)"
  if (p >= 60) return "rgba(34,211,238,0.9)"
  if (p >= 40) return "rgba(99,102,241,0.9)"
  if (p >= 20) return "rgba(251,191,36,0.9)"
  return "rgba(239,68,68,0.9)"
}

interface Props {
  signal: ProbabilitySignal
}

const ProbabilitySignalCard: React.FC<Props> = memo(({ signal }) => {
  const ic = impactColor(signal.impactLevel)
  const pColor = probabilityColor(signal.probability)

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        padding: "8px 10px",
        borderRadius: "6px",
        background: "rgba(6,10,16,0.55)",
        border: "1px solid rgba(200,215,230,0.08)",
      }}
    >
      {/* Title row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: "9px",
            fontWeight: 700,
            color: "rgba(34,211,238,0.8)",
            letterSpacing: "0.1em",
          }}
        >
          #{signal.rank}
        </span>
        <span
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "11px",
            fontWeight: 600,
            color: "rgba(226,232,240,0.92)",
            flex: 1,
          }}
        >
          {signal.title}
        </span>
        {/* Probability badge */}
        <span
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: "10px",
            fontWeight: 700,
            color: pColor,
            letterSpacing: "0.04em",
          }}
        >
          {signal.probability}%
        </span>
        {/* Impact level badge */}
        <span
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "8px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "1px 5px",
            borderRadius: "3px",
            background: ic.bg,
            color: ic.fg,
            border: `1px solid ${ic.border}`,
          }}
        >
          {signal.impactLevel}
        </span>
      </div>
      {/* Interpretation */}
      <div
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: "10.5px",
          lineHeight: "1.45",
          color: "rgba(226,232,240,0.62)",
        }}
      >
        {signal.interpretation}
      </div>
    </div>
  )
})

ProbabilitySignalCard.displayName = "ProbabilitySignalCard"
export default ProbabilitySignalCard
