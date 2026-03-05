// src/components/position/PositionExecSummary.tsx
// Compact KPI-intelligence executive summary block for the Position left rail.

import React, { memo, useState } from "react"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import { getExecutiveSummary } from "@/domain/intelligence/kpiCommentary"

function fmtMoney(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${Math.round(n).toLocaleString()}`
}

interface Props {
  kpis: PositionKpis | null
  revealedCount?: number
}

const TONE_COLORS: Record<string, { border: string; bg: string; badge: string }> = {
  critical:    { border: "rgba(239,68,68,0.55)",  bg: "rgba(239,68,68,0.06)",  badge: "#f87171" },
  challenging: { border: "rgba(250,204,21,0.50)",  bg: "rgba(250,204,21,0.05)", badge: "#facc15" },
  stable:      { border: "rgba(34,211,238,0.50)",  bg: "rgba(34,211,238,0.05)", badge: "#22d3ee" },
  strong:      { border: "rgba(52,211,153,0.55)",  bg: "rgba(52,211,153,0.06)", badge: "#34d399" },
}

const PositionExecSummary: React.FC<Props> = memo(({ kpis, revealedCount = 10 }) => {
  const [expanded, setExpanded] = useState(false)

  if (!kpis) return null

  const { label, tone, narrative } = getExecutiveSummary(kpis, revealedCount)
  const colors = TONE_COLORS[tone] ?? TONE_COLORS.stable
  const rw = kpis.runwayMonths

  return (
    <div
      style={{
        width: "100%",
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
        background: `linear-gradient(175deg, ${colors.bg}, rgba(10,14,20,0.90))`,
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginBottom: 6,
        cursor: "pointer",
        transition: "border-color 300ms ease, box-shadow 300ms ease",
        boxShadow: expanded
          ? `0 0 18px ${colors.border}, 0 4px 14px rgba(0,0,0,0.30)`
          : `0 4px 14px rgba(0,0,0,0.25)`,
      }}
      onClick={() => setExpanded((p) => !p)}
    >
      {/* Badge row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: colors.badge,
          padding: "2px 8px",
          borderRadius: 999,
          border: `1px solid ${colors.border}`,
          background: colors.bg,
        }}>
          {label}
        </span>
        <span style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 9,
          fontWeight: 600,
          color: "rgba(200,220,240,0.50)",
          letterSpacing: "0.10em",
          textTransform: "uppercase",
        }}>
          POSITION ASSESSMENT
        </span>
      </div>

      {/* Key numbers strip */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <KeyMetric label="Survival" value={`${kpis.riskIndex.toFixed(0)}%`} color={colors.badge} />
        <KeyMetric label="EV (P50)" value={kpis.valuationEstimate > 0 ? fmtMoney(kpis.valuationEstimate) : "—"} color="rgba(163,230,53,0.80)" />
        <KeyMetric label="Runway" value={Number.isFinite(rw) ? `${rw.toFixed(1)}m` : "∞"} color="rgba(52,211,153,0.80)" />
        <KeyMetric label="ARR" value={fmtMoney(kpis.arr)} color="rgba(96,165,250,0.80)" />
      </div>

      {/* Expandable narrative */}
      <div style={{
        maxHeight: expanded ? 120 : 0,
        overflow: "hidden",
        opacity: expanded ? 1 : 0,
        transition: "max-height 320ms ease, opacity 280ms ease",
      }}>
        <p style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 11,
          lineHeight: 1.55,
          color: "rgba(200,220,240,0.75)",
          margin: 0,
          padding: "4px 0",
        }}>
          {narrative}
        </p>
      </div>

      {/* Expand hint */}
      <div style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 8,
        color: "rgba(148,180,214,0.40)",
        textAlign: "center",
        letterSpacing: "0.10em",
        textTransform: "uppercase",
      }}>
        {expanded ? "COLLAPSE" : "TAP TO EXPAND BRIEF"}
      </div>
    </div>
  )
})

function KeyMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, minWidth: 48 }}>
      <span style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 8,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "rgba(148,180,214,0.45)",
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 14,
        fontWeight: 700,
        color,
        fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </span>
    </div>
  )
}

PositionExecSummary.displayName = "PositionExecSummary"
export default PositionExecSummary
