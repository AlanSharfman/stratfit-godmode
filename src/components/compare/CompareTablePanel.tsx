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
import type { DeltaMetrics, MetricDelta, DeltaUnit } from "@/engine/compareDeltas"

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
  /**
   * Projection-sourced delta metrics computed by compareDeltas.ts.
   * When present, rendered as highlight cards above the detail table.
   */
  deltaMetrics?: DeltaMetrics | null
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

// Gross margin, growth rate, churn rate are stored as 0-1 decimals in SimulationKpis.
// normalPct ensures consistent display regardless of upstream encoding.
function normalPct(v: number): number {
  return Math.abs(v) <= 1 ? v * 100 : v
}

// Enterprise value: ARR × growth-rate multiple (SaaS heuristic, capped 2× – 30×)
function deriveEV(k: SimulationKpis): number {
  const arr = k.revenue * 12
  const gr = Math.abs(k.growthRate) <= 1 ? k.growthRate : k.growthRate / 100
  const multiple = Math.max(2, Math.min(30, gr * 40))
  return arr * multiple
}

// EBITDA proxy: gross profit minus operating expenditure
// gross profit  = revenue * gross_margin
// opex approx   = monthlyBurn - COGS  = monthlyBurn - revenue * (1 - margin)
// EBITDA        = gross_profit - opex = revenue - monthlyBurn
function deriveEBITDA(k: SimulationKpis): number {
  return k.revenue - k.monthlyBurn
}

const METRICS: MetricDef[] = [
  { key: "revenue",         label: "Revenue (MRR)",    group: "ECONOMICS",  upIsGood: true,  extract: (k) => k.revenue,                  fmt: $$ },
  { key: "arr",             label: "ARR",              group: "ECONOMICS",  upIsGood: true,  extract: (k) => k.revenue * 12,             fmt: $$ },
  { key: "ebitda",          label: "EBITDA (proxy)",   group: "ECONOMICS",  upIsGood: true,  extract: (k) => deriveEBITDA(k),            fmt: $$ },
  { key: "grossMargin",     label: "Gross Margin",     group: "ECONOMICS",  upIsGood: true,  extract: (k) => normalPct(k.grossMargin),   fmt: pctRaw },
  { key: "growthRate",      label: "Growth Rate",      group: "ECONOMICS",  upIsGood: true,  extract: (k) => normalPct(k.growthRate),    fmt: pctRaw },
  { key: "arpa",            label: "ARPA",             group: "ECONOMICS",  upIsGood: true,  extract: (k) => k.arpa,                     fmt: $$ },
  { key: "enterpriseValue", label: "Enterprise Value", group: "ECONOMICS",  upIsGood: true,  extract: (k) => deriveEV(k),               fmt: $$ },
  { key: "cash",            label: "Cash / Liquidity", group: "SURVIVAL",   upIsGood: true,  extract: (k) => k.cash,                    fmt: $$ },
  { key: "burn",            label: "Monthly Burn",     group: "SURVIVAL",   upIsGood: false, extract: (k) => k.monthlyBurn,              fmt: $$ },
  { key: "runway",          label: "Runway",           group: "SURVIVAL",   upIsGood: true,  extract: (k) => k.runway,                  fmt: mo },
  { key: "risk",            label: "Risk Score",       group: "SURVIVAL",   upIsGood: true,  extract: (k) => selectRiskScore(k),        fmt: score },
  { key: "headcount",       label: "Headcount",        group: "OPERATIONS", upIsGood: true,  extract: (k) => k.headcount,               fmt: num },
  { key: "churnRate",       label: "Churn Rate",       group: "OPERATIONS", upIsGood: false, extract: (k) => normalPct(k.churnRate),    fmt: pctRaw },
]

/* ── Delta card formatters ── */

function fmtDeltaValue(d: MetricDelta): string {
  const { absDelta, unit } = d
  const sign = absDelta > 0 ? "+" : ""
  if (unit === "currency") return `${sign}${$$(absDelta)}`
  if (unit === "months")   return `${sign}${Math.round(absDelta)}mo`
  if (unit === "score")    return `${sign}${absDelta.toFixed(0)}pts`
  if (unit === "percent")  return `${sign}${absDelta.toFixed(1)}pp`
  return `${sign}${absDelta.toFixed(1)}`
}

function fmtPct(d: MetricDelta): string {
  if (d.pctDelta == null) return ""
  return `${d.pctDelta > 0 ? "+" : ""}${d.pctDelta.toFixed(1)}%`
}

function fmtByUnit(v: number, unit: DeltaUnit): string {
  if (unit === "currency") return $$(v)
  if (unit === "months")   return `${Math.round(v)}mo`
  if (unit === "score")    return v.toFixed(0)
  if (unit === "percent")  return `${v.toFixed(1)}%`
  return v.toFixed(1)
}

function deltaColor(d: MetricDelta): string {
  if (Math.abs(d.absDelta) < 0.0001) return "rgba(148,180,214,0.4)"
  const positive = d.upIsGood ? d.absDelta > 0 : d.absDelta < 0
  return positive ? "#B7FF3C" : "#6E5BFF"
}

/* ── Delta highlights bar ── */

const DELTA_KEYS: (keyof DeltaMetrics)[] = [
  "revenueDelta",
  "ebitdaDelta",
  "cashDelta",
  "runwayDelta",
  "riskDelta",
  "enterpriseValueDelta",
]

interface DeltaHighlightBarProps {
  deltaMetrics: DeltaMetrics
  labelLeft: string
  labelRight: string
}

const DeltaHighlightBar: React.FC<DeltaHighlightBarProps> = ({ deltaMetrics, labelLeft, labelRight }) => (
  <div style={SD.bar}>
    {DELTA_KEYS.map((key) => {
      const d = deltaMetrics[key]
      const col = deltaColor(d)
      return (
        <div key={key} style={SD.card}>
          <span style={SD.cardLabel}>{d.label}</span>
          <div style={SD.cardRow}>
            <span style={SD.cardSide}>{labelLeft}</span>
            <span style={SD.cardVal}>{fmtByUnit(d.baseline, d.unit)}</span>
          </div>
          <div style={SD.cardRow}>
            <span style={SD.cardSide}>{labelRight}</span>
            <span style={SD.cardVal}>{fmtByUnit(d.scenario, d.unit)}</span>
          </div>
          <div style={{ ...SD.cardDelta, color: col }}>
            <span>{fmtDeltaValue(d)}</span>
            {d.pctDelta != null && (
              <span style={SD.cardPct}>{fmtPct(d)}</span>
            )}
          </div>
        </div>
      )
    })}
  </div>
)

/* ── Component ── */

const CompareTablePanel: React.FC<CompareTablePanelProps> = memo(
  ({ kpisLeft, kpisRight, labelLeft, labelRight, activePair, is3Way, onPairChange, deltaMetrics }) => {
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
        {/* ── Delta highlight cards — projection-sourced canonical deltas ── */}
        {deltaMetrics && (
          <DeltaHighlightBar
            deltaMetrics={deltaMetrics}
            labelLeft={labelLeft}
            labelRight={labelRight}
          />
        )}

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
                      ? "#B7FF3C"
                      : isNeg
                        ? "#6E5BFF"
                        : "rgba(148,180,214,0.4)"

                    const fmtDelta = () => {
                      if (vL == null || vR == null) return "—"
                      const sign = delta > 0 ? "+" : ""
                      // Currency metrics
                      if (["revenue", "arr", "cash", "burn", "arpa", "ebitda", "enterpriseValue"].includes(m.key))
                        return `${sign}${$$(delta)}`
                      if (m.key === "runway") return `${sign}${Math.round(delta)}mo`
                      if (m.key === "risk") return `${sign}${delta.toFixed(0)}pts`
                      if (m.key === "headcount") return `${sign}${delta.toFixed(0)}`
                      // Percentage metrics are already normalised to 0-100 by normalPct in extract,
                      // so delta is in percentage-point form — no ×100 needed.
                      return `${sign}${delta.toFixed(1)}pp`
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

/* ── Delta highlight bar styles ── */

const SD: Record<string, React.CSSProperties> = {
  bar: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 1,
    background: "rgba(33,212,253,0.04)",
    borderBottom: "1px solid rgba(33,212,253,0.12)",
    padding: "10px 12px",
    flexShrink: 0,
  },

  card: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    padding: "8px 10px",
    background: "rgba(11,31,54,0.55)",
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.05)",
  },

  cardLabel: {
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: "rgba(33,212,253,0.5)",
    fontFamily: FONT,
    marginBottom: 2,
  },

  cardRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 4,
  },

  cardSide: {
    fontSize: 9,
    fontWeight: 500,
    color: "rgba(148,180,214,0.45)",
    fontFamily: FONT,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    maxWidth: "55%",
  },

  cardVal: {
    fontSize: 11,
    fontWeight: 600,
    color: "rgba(226,240,255,0.75)",
    fontFamily: MONO,
    whiteSpace: "nowrap" as const,
  },

  cardDelta: {
    display: "flex",
    alignItems: "baseline",
    gap: 5,
    marginTop: 2,
    fontSize: 12,
    fontWeight: 700,
    fontFamily: MONO,
    borderTop: "1px solid rgba(255,255,255,0.04)",
    paddingTop: 4,
  },

  cardPct: {
    fontSize: 9,
    fontWeight: 600,
    opacity: 0.7,
    fontFamily: MONO,
  },
}
