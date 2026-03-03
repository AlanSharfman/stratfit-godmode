// src/components/compare/CompareTablePanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Compare Table Panel (Bottom-Left Analytics)
//
// KPI comparison table with pair selector for 3-way mode.
// Uses SimulationKpis from canonical store. No engine calculations.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useMemo } from "react"
import type { SimulationKpis } from "@/state/phase1ScenarioStore"
import { selectRiskScore } from "@/selectors/riskSelectors"
import type { ComparePair } from "@/store/compareStore"

export interface CompareTablePanelProps {
  kpisLeft: SimulationKpis | null
  kpisRight: SimulationKpis | null
  labelLeft: string
  labelRight: string
  /** 3-way mode: active comparison pair */
  activePair: ComparePair
  /** Whether 3-way mode is on */
  is3Way: boolean
  onPairChange: (pair: ComparePair) => void
}

/* ── Metric Definitions ── */

interface MetricDef {
  key: string
  label: string
  group: string
  upIsGood: boolean
  extract: (k: SimulationKpis) => number | null
  fmt: (v: number | null) => string
}

function $$(v: number | null): string {
  if (v == null) return "—"
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}
function pct(v: number | null): string {
  if (v == null) return "—"
  return `${(v * 100).toFixed(1)}%`
}
function pctRaw(v: number | null): string {
  if (v == null) return "—"
  return `${v.toFixed(1)}%`
}
function mo(v: number | null): string {
  if (v == null) return "∞"
  return `${Math.round(v)}mo`
}
function num(v: number | null): string {
  if (v == null) return "—"
  return v.toLocaleString()
}
function score(v: number | null): string {
  if (v == null) return "—"
  return v.toFixed(0)
}

const METRICS: MetricDef[] = [
  { key: "revenue",     label: "Revenue (MRR)", group: "ECONOMICS",  upIsGood: true,  extract: (k) => k.revenue,          fmt: $$ },
  { key: "arr",         label: "ARR",           group: "ECONOMICS",  upIsGood: true,  extract: (k) => k.revenue * 12,     fmt: $$ },
  { key: "grossMargin", label: "Gross Margin",  group: "ECONOMICS",  upIsGood: true,  extract: (k) => k.grossMargin,      fmt: pctRaw },
  { key: "growthRate",  label: "Growth Rate",   group: "ECONOMICS",  upIsGood: true,  extract: (k) => k.growthRate,        fmt: pct },
  { key: "arpa",        label: "ARPA",          group: "ECONOMICS",  upIsGood: true,  extract: (k) => k.arpa,             fmt: $$ },
  { key: "cash",        label: "Cash",          group: "SURVIVAL",   upIsGood: true,  extract: (k) => k.cash,             fmt: $$ },
  { key: "burn",        label: "Monthly Burn",  group: "SURVIVAL",   upIsGood: false, extract: (k) => k.monthlyBurn,      fmt: $$ },
  { key: "runway",      label: "Runway",        group: "SURVIVAL",   upIsGood: true,  extract: (k) => k.runway,           fmt: mo },
  { key: "risk",        label: "Risk Score",    group: "SURVIVAL",   upIsGood: false, extract: (k) => selectRiskScore(k),  fmt: score },
  { key: "headcount",   label: "Headcount",     group: "OPERATIONS", upIsGood: true,  extract: (k) => k.headcount,        fmt: num },
  { key: "churnRate",   label: "Churn Rate",    group: "OPERATIONS", upIsGood: false, extract: (k) => k.churnRate,         fmt: pct },
]

/* ── Component ── */

const CompareTablePanel: React.FC<CompareTablePanelProps> = memo(
  ({ kpisLeft, kpisRight, labelLeft, labelRight, activePair, is3Way, onPairChange }) => {
    const rows = useMemo(() => {
      const groups: { group: string; items: typeof METRICS }[] = []
      const seen = new Set<string>()
      for (const m of METRICS) {
        if (!seen.has(m.group)) {
          seen.add(m.group)
          groups.push({ group: m.group, items: [] })
        }
        groups.find((g) => g.group === m.group)!.items.push(m)
      }
      return groups
    }, [])

    return (
      <div style={S.root}>
        {/* ── Header ── */}
        <div style={S.header}>
          <span style={S.title}>Comparison Table</span>
          <div style={S.pairBar}>
            <span style={S.pairLabel}>
              {labelLeft} vs {labelRight}
            </span>
            {is3Way && (
              <div style={S.pairToggle}>
                {(["AB", "AC", "BC"] as ComparePair[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onPairChange(p)}
                    style={activePair === p ? S.pairBtnActive : S.pairBtn}
                  >
                    {p[0]}↔{p[1]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div style={S.scroll}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={{ ...S.th, textAlign: "left" }}>Metric</th>
                <th style={S.th}>{labelLeft}</th>
                <th style={S.th}>{labelRight}</th>
                <th style={S.th}>Δ Abs</th>
                <th style={S.th}>Δ %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => (
                <React.Fragment key={g.group}>
                  <tr>
                    <td colSpan={5} style={S.groupHeader}>
                      {g.group}
                    </td>
                  </tr>
                  {g.items.map((m) => {
                    const vL = kpisLeft ? m.extract(kpisLeft) : null
                    const vR = kpisRight ? m.extract(kpisRight) : null
                    const delta = (vR ?? 0) - (vL ?? 0)
                    const pctChg =
                      vL != null && vL !== 0 ? (delta / Math.abs(vL)) * 100 : null

                    const isPos = m.upIsGood ? delta > 0.001 : delta < -0.001
                    const isNeg = m.upIsGood ? delta < -0.001 : delta > 0.001
                    const color = isPos
                      ? "#22c55e"
                      : isNeg
                        ? "#ef4444"
                        : "rgba(148,180,214,0.4)"

                    const fmtDelta = () => {
                      if (vL == null || vR == null) return "—"
                      const sign = delta > 0 ? "+" : ""
                      if (m.key === "revenue" || m.key === "arr" || m.key === "cash" || m.key === "burn" || m.key === "arpa")
                        return `${sign}${$$(delta).replace("$", "$")}`
                      if (m.key === "runway") return `${sign}${Math.round(delta)}mo`
                      if (m.key === "risk") return `${sign}${delta.toFixed(0)}pts`
                      if (m.key === "headcount") return `${sign}${delta.toFixed(0)}`
                      return `${sign}${(delta * 100).toFixed(1)}pp`
                    }

                    return (
                      <tr key={m.key} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={S.cellMetric}>{m.label}</td>
                        <td style={S.cellVal}>{m.fmt(vL)}</td>
                        <td style={S.cellVal}>{m.fmt(vR)}</td>
                        <td style={{ ...S.cellDelta, color }}>{fmtDelta()}</td>
                        <td style={{ ...S.cellDelta, color }}>
                          {pctChg != null ? `${pctChg > 0 ? "+" : ""}${pctChg.toFixed(1)}%` : "—"}
                        </td>
                      </tr>
                    )
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  },
)

CompareTablePanel.displayName = "CompareTablePanel"
export default CompareTablePanel

/* ── Styles ── */

const FONT = "'Inter', system-ui, sans-serif"
const MONO = "ui-monospace, 'JetBrains Mono', monospace"

const S: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
    background: "rgba(0,0,0,0.3)",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.04)",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 14px",
    borderBottom: "1px solid rgba(34,211,238,0.1)",
    background: "rgba(0,0,0,0.3)",
    flexShrink: 0,
  },

  title: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "rgba(34,211,238,0.55)",
    fontFamily: FONT,
  },

  pairBar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  pairLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: "rgba(148,180,214,0.4)",
    fontFamily: FONT,
    letterSpacing: "0.04em",
  },

  pairToggle: {
    display: "flex",
    gap: 0,
    borderRadius: 3,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.06)",
  },

  pairBtn: {
    fontSize: 9,
    fontWeight: 600,
    padding: "2px 8px",
    border: "none",
    background: "rgba(0,0,0,0.3)",
    color: "rgba(148,180,214,0.4)",
    cursor: "pointer",
    fontFamily: FONT,
    letterSpacing: "0.06em",
    transition: "background 150ms, color 150ms",
  },

  pairBtnActive: {
    fontSize: 9,
    fontWeight: 700,
    padding: "2px 8px",
    border: "none",
    background: "rgba(34,211,238,0.12)",
    color: "rgba(34,211,238,0.85)",
    cursor: "pointer",
    fontFamily: FONT,
    letterSpacing: "0.06em",
  },

  scroll: {
    flex: 1,
    overflowY: "auto" as const,
    overflowX: "hidden" as const,
    scrollbarWidth: "thin" as const,
    scrollbarColor: "rgba(34,211,238,0.1) transparent",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },

  th: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "rgba(34,211,238,0.45)",
    textAlign: "right" as const,
    padding: "6px 10px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    position: "sticky" as const,
    top: 0,
    background: "rgba(6,12,20,0.95)",
    zIndex: 2,
    fontFamily: FONT,
    whiteSpace: "nowrap" as const,
  },

  groupHeader: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "rgba(255,255,255,0.2)",
    padding: "8px 10px 4px",
    borderBottom: "1px solid rgba(255,255,255,0.03)",
    fontFamily: FONT,
  },

  cellMetric: {
    fontSize: 11,
    fontWeight: 600,
    color: "rgba(226,240,255,0.7)",
    padding: "5px 10px",
    fontFamily: FONT,
    whiteSpace: "nowrap" as const,
  },

  cellVal: {
    fontSize: 11,
    fontWeight: 500,
    color: "rgba(148,180,214,0.55)",
    padding: "5px 10px",
    textAlign: "right" as const,
    fontFamily: MONO,
    whiteSpace: "nowrap" as const,
  },

  cellDelta: {
    fontSize: 11,
    fontWeight: 700,
    padding: "5px 10px",
    textAlign: "right" as const,
    fontFamily: MONO,
    whiteSpace: "nowrap" as const,
  },
}
