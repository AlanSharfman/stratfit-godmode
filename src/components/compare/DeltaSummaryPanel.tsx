// src/components/compare/DeltaSummaryPanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Delta Summary Panel (Phase D1 — God Mode)
//
// Compact right-rail KPI delta display.
// 4 key deltas: Revenue, Cash, Risk, Runway.
// Up/down directional glow. No arrows. Institutional typography.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo, memo } from "react"
import type { SimulationKpis } from "@/state/phase1ScenarioStore"
import { selectKpis, selectKpiDeltas } from "@/selectors/kpiSelectors"
import { selectRiskScore } from "@/selectors/riskSelectors"

export interface DeltaSummaryPanelProps {
  /** Baseline-side KPIs (A) */
  kpisA: SimulationKpis | null
  /** Scenario-side KPIs (B) */
  kpisB: SimulationKpis | null
}

interface DeltaRow {
  label: string
  valueA: string
  valueB: string
  delta: string
  direction: "up" | "down" | "flat"
  /** Whether "up" is positive (green) or negative (red) */
  upIsGood: boolean
}

function fmtCurrency(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

function fmtDelta(v: number, suffix = ""): string {
  const sign = v > 0 ? "+" : ""
  if (Math.abs(v) >= 1_000_000) return `${sign}${(v / 1_000_000).toFixed(1)}M${suffix}`
  if (Math.abs(v) >= 1_000) return `${sign}${(v / 1_000).toFixed(0)}K${suffix}`
  return `${sign}${v.toFixed(1)}${suffix}`
}

function direction(v: number): "up" | "down" | "flat" {
  if (v > 0.001) return "up"
  if (v < -0.001) return "down"
  return "flat"
}

const DeltaSummaryPanel: React.FC<DeltaSummaryPanelProps> = memo(({ kpisA, kpisB }) => {
  const rows = useMemo<DeltaRow[]>(() => {
    const selA = selectKpis(kpisA)
    const selB = selectKpis(kpisB)
    const deltas = selectKpiDeltas(selA, selB)
    const riskA = kpisA ? selectRiskScore(kpisA) : 0
    const riskB = kpisB ? selectRiskScore(kpisB) : 0
    const riskDelta = riskB - riskA

    if (!selA || !selB || !deltas) {
      return [
        { label: "Revenue", valueA: "—", valueB: "—", delta: "—", direction: "flat" as const, upIsGood: true },
        { label: "Cash", valueA: "—", valueB: "—", delta: "—", direction: "flat" as const, upIsGood: true },
        { label: "Risk", valueA: "—", valueB: "—", delta: "—", direction: "flat" as const, upIsGood: false },
        { label: "Runway", valueA: "—", valueB: "—", delta: "—", direction: "flat" as const, upIsGood: true },
      ]
    }

    return [
      {
        label: "Revenue",
        valueA: fmtCurrency(selA.revenue),
        valueB: fmtCurrency(selB.revenue),
        delta: fmtDelta(deltas.revenueDelta),
        direction: direction(deltas.revenueDelta),
        upIsGood: true,
      },
      {
        label: "Cash",
        valueA: fmtCurrency(selA.cashOnHand),
        valueB: fmtCurrency(selB.cashOnHand),
        delta: fmtDelta(deltas.cashDelta),
        direction: direction(deltas.cashDelta),
        upIsGood: true,
      },
      {
        label: "Risk",
        valueA: `${riskA.toFixed(0)}`,
        valueB: `${riskB.toFixed(0)}`,
        delta: fmtDelta(riskDelta, "pts"),
        direction: direction(riskDelta),
        upIsGood: false,
      },
      {
        label: "Runway",
        valueA: selA.runwayMonths != null ? `${selA.runwayMonths.toFixed(0)}mo` : "∞",
        valueB: selB.runwayMonths != null ? `${selB.runwayMonths.toFixed(0)}mo` : "∞",
        delta: deltas.runwayDelta != null ? fmtDelta(deltas.runwayDelta, "mo") : "—",
        direction: deltas.runwayDelta != null ? direction(deltas.runwayDelta) : "flat",
        upIsGood: true,
      },
    ]
  }, [kpisA, kpisB])

  return (
    <div style={S.panel}>
      <div style={S.header}>
        <span style={S.headerIcon}>◆</span>
        <span style={S.headerText}>Delta Summary</span>
      </div>
      <div style={S.rows}>
        {rows.map((row) => {
          const isPositive =
            row.direction === "flat"
              ? null
              : row.upIsGood
                ? row.direction === "up"
                : row.direction === "down"

          const glowColor =
            isPositive === null
              ? "rgba(148,180,214,0.15)"
              : isPositive
                ? "rgba(34,197,94,0.12)"
                : "rgba(239,68,68,0.12)"

          const deltaColor =
            isPositive === null
              ? "rgba(148,180,214,0.4)"
              : isPositive
                ? "rgba(34,197,94,0.85)"
                : "rgba(239,68,68,0.85)"

          return (
            <div
              key={row.label}
              style={{
                ...S.row,
                background: glowColor,
              }}
            >
              <div style={S.rowTop}>
                <span style={S.rowLabel}>{row.label}</span>
                <span style={{ ...S.rowDelta, color: deltaColor }}>
                  {row.delta}
                </span>
              </div>
              <div style={S.rowValues}>
                <span style={S.rowValueA}>{row.valueA}</span>
                <span style={S.rowSep}>→</span>
                <span style={S.rowValueB}>{row.valueB}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

DeltaSummaryPanel.displayName = "DeltaSummaryPanel"
export default DeltaSummaryPanel

/* ── Styles ── */
const FONT = "'Inter', system-ui, sans-serif"
const MONO = "ui-monospace, 'JetBrains Mono', monospace"

const S: Record<string, React.CSSProperties> = {
  panel: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },

  headerIcon: {
    fontSize: 10,
    color: "rgba(34,211,238,0.7)",
  },

  headerText: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "rgba(148,180,214,0.65)",
    fontFamily: FONT,
  },

  rows: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  row: {
    padding: "10px 12px",
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.06)",
    transition: "background 200ms ease",
  },

  rowTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 4,
  },

  rowLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "rgba(226,240,255,0.75)",
    fontFamily: FONT,
  },

  rowDelta: {
    fontSize: 12,
    fontWeight: 700,
    fontFamily: MONO,
    letterSpacing: "-0.02em",
  },

  rowValues: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 10,
    fontFamily: MONO,
    color: "rgba(148,180,214,0.45)",
  },

  rowValueA: {},
  rowValueB: {
    color: "rgba(226,240,255,0.6)",
  },

  rowSep: {
    fontSize: 8,
    color: "rgba(255,255,255,0.15)",
  },
}
