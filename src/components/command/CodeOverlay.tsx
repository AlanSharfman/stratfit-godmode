// src/components/command/CodeOverlay.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Code Overlay (Command Centre — God Mode)
//
// Numeric metric grid overlay — monospace, top-left corner.
// Institutional debug surface. No scroll.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useMemo } from "react"
import type { SimulationKpis } from "@/state/phase1ScenarioStore"
import type { TerrainMetrics } from "@/terrain/terrainFromBaseline"

interface CodeOverlayProps {
  kpis: SimulationKpis | null
  terrainMetrics: TerrainMetrics | null | undefined
  riskScore: number
  visible: boolean
}

function fmt(v: number | null | undefined, decimals = 1): string {
  if (v == null || !Number.isFinite(v)) return "—"
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(decimals)}M`
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`
  return v.toFixed(decimals)
}

const CodeOverlay: React.FC<CodeOverlayProps> = memo(
  ({ kpis, terrainMetrics, riskScore, visible }) => {
    const lines = useMemo(() => {
      const rows: [string, string][] = []

      if (kpis) {
        rows.push(
          ["REV",      `$${fmt(kpis.revenue)}`],
          ["BURN",     `$${fmt(kpis.monthlyBurn)}`],
          ["CASH",     `$${fmt(kpis.cash)}`],
          ["RUNWAY",   kpis.runway != null ? `${kpis.runway}mo` : "∞"],
          ["GM",       `${(kpis.grossMargin * (Math.abs(kpis.grossMargin) <= 1 ? 100 : 1)).toFixed(0)}%`],
          ["GROWTH",   `${(kpis.growthRate * (Math.abs(kpis.growthRate) <= 1 ? 100 : 1)).toFixed(1)}%`],
          ["CHURN",    `${(kpis.churnRate * (Math.abs(kpis.churnRate) <= 1 ? 100 : 1)).toFixed(1)}%`],
          ["HC",       `${kpis.headcount}`],
        )
      }

      if (terrainMetrics) {
        rows.push(
          ["─────",    "─────"],
          ["ELEV",     terrainMetrics.elevationScale.toFixed(2)],
          ["ROUGH",    terrainMetrics.roughness.toFixed(2)],
          ["VOL",      (terrainMetrics.volatility ?? 0).toFixed(3)],
          ["LIQ-D",    (terrainMetrics.liquidityDepth ?? 0).toFixed(2)],
          ["GRW-S",    (terrainMetrics.growthSlope ?? 0).toFixed(3)],
        )
        if (terrainMetrics.ridgeIntensity != null) {
          rows.push(["RIDGE", terrainMetrics.ridgeIntensity.toFixed(3)])
        }
      }

      rows.push(
        ["─────",  "─────"],
        ["RISK",   `${riskScore.toFixed(0)}`],
      )

      return rows
    }, [kpis, terrainMetrics, riskScore])

    if (!visible) return null

    return (
      <div style={S.container} aria-hidden="true">
        <div style={S.header}>CODE</div>
        <div style={S.grid}>
          {lines.map(([label, value], i) => (
            <div key={i} style={S.row}>
              <span style={S.label}>{label}</span>
              <span style={S.value}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  },
)

CodeOverlay.displayName = "CodeOverlay"
export default CodeOverlay

/* ── Styles ── */

const MONO = "ui-monospace, 'JetBrains Mono', monospace"

const S: Record<string, React.CSSProperties> = {
  container: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 3,
    padding: "8px 10px",
    borderRadius: 6,
    background: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(182,228,255,0.1)",
    maxWidth: 160,
    pointerEvents: "none",
  },

  header: {
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: "0.2em",
    color: "rgba(34,211,238,0.5)",
    fontFamily: MONO,
    marginBottom: 6,
  },

  grid: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
  },

  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 8,
  },

  label: {
    fontSize: 9,
    fontWeight: 600,
    color: "rgba(148,180,214,0.4)",
    fontFamily: MONO,
    letterSpacing: "0.06em",
    whiteSpace: "nowrap",
  },

  value: {
    fontSize: 9,
    fontWeight: 700,
    color: "rgba(226,240,255,0.7)",
    fontFamily: MONO,
    textAlign: "right",
    whiteSpace: "nowrap",
  },
}
