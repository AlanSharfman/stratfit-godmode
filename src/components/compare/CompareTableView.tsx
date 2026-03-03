// src/components/compare/CompareTableView.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Compare Table View
//
// Full tabular comparison of two scenarios with delta variances and
// AI-generated commentary for each metric. Replaces split-terrain view
// when user toggles to TABLE mode.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useMemo } from "react"
import type { SimulationKpis } from "@/state/phase1ScenarioStore"
import { selectKpis, selectKpiDeltas } from "@/selectors/kpiSelectors"
import { selectRiskScore } from "@/selectors/riskSelectors"

export interface CompareTableViewProps {
  kpisA: SimulationKpis | null
  kpisB: SimulationKpis | null
  labelA: string
  labelB: string
  /** Scenario decision descriptions for commentary context */
  decisionA?: string
  decisionB?: string
}

// ── Metric Definition ──

interface MetricDef {
  key: string
  label: string
  unit: string
  /** Whether higher is better (green) */
  upIsGood: boolean
  extract: (kpis: SimulationKpis) => number | null
  format: (v: number | null) => string
}

function fmtCurrency(v: number | null): string {
  if (v == null) return "—"
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

function fmtPct(v: number | null): string {
  if (v == null) return "—"
  return `${(v * 100).toFixed(1)}%`
}

function fmtPctRaw(v: number | null): string {
  if (v == null) return "—"
  return `${v.toFixed(1)}%`
}

function fmtMonths(v: number | null): string {
  if (v == null) return "∞"
  return `${Math.round(v)}mo`
}

function fmtNumber(v: number | null): string {
  if (v == null) return "—"
  return v.toLocaleString()
}

function fmtScore(v: number | null): string {
  if (v == null) return "—"
  return v.toFixed(0)
}

const METRICS: MetricDef[] = [
  { key: "revenue",     label: "Revenue (MRR)",   unit: "$",  upIsGood: true,  extract: (k) => k.revenue,     format: fmtCurrency },
  { key: "arr",         label: "ARR",             unit: "$",  upIsGood: true,  extract: (k) => k.revenue * 12,format: fmtCurrency },
  { key: "cash",        label: "Cash on Hand",    unit: "$",  upIsGood: true,  extract: (k) => k.cash,        format: fmtCurrency },
  { key: "burn",        label: "Monthly Burn",    unit: "$",  upIsGood: false, extract: (k) => k.monthlyBurn, format: fmtCurrency },
  { key: "runway",      label: "Runway",          unit: "mo", upIsGood: true,  extract: (k) => k.runway,      format: fmtMonths },
  { key: "grossMargin", label: "Gross Margin",    unit: "%",  upIsGood: true,  extract: (k) => k.grossMargin, format: fmtPctRaw },
  { key: "growthRate",  label: "Growth Rate",     unit: "%",  upIsGood: true,  extract: (k) => k.growthRate,  format: fmtPct },
  { key: "churnRate",   label: "Churn Rate",      unit: "%",  upIsGood: false, extract: (k) => k.churnRate,   format: fmtPct },
  { key: "headcount",   label: "Headcount",       unit: "",   upIsGood: true,  extract: (k) => k.headcount,   format: fmtNumber },
  { key: "arpa",        label: "ARPA",            unit: "$",  upIsGood: true,  extract: (k) => k.arpa,        format: fmtCurrency },
  { key: "risk",        label: "Risk Score",      unit: "pts",upIsGood: false, extract: (k) => selectRiskScore(k), format: fmtScore },
]

// ── AI Commentary Generator ──

function generateCommentary(
  key: string,
  valA: number | null,
  valB: number | null,
  upIsGood: boolean,
): string {
  if (valA == null || valB == null) return "Insufficient data for comparison."
  if (valA === 0 && valB === 0) return "Both scenarios report zero — no variance."

  const delta = valB - valA
  const pctChange = valA !== 0 ? (delta / Math.abs(valA)) * 100 : 0
  const absPct = Math.abs(pctChange)
  const isUp = delta > 0
  const isGood = upIsGood ? isUp : !isUp

  const magnitude =
    absPct < 2 ? "negligible" :
    absPct < 10 ? "modest" :
    absPct < 25 ? "meaningful" :
    absPct < 50 ? "significant" :
    "substantial"

  const commentary: Record<string, () => string> = {
    revenue: () =>
      isGood
        ? `Scenario B shows ${magnitude} revenue improvement (${absPct.toFixed(1)}%). ${absPct > 15 ? "This could meaningfully accelerate growth trajectory." : "Monitor sustainability of this gain."}`
        : `Revenue declines ${absPct.toFixed(1)}% under Scenario B. ${absPct > 20 ? "This signals structural revenue risk — assess demand assumptions." : "Modest decline — may reflect near-term trade-off for longer-term positioning."}`,
    arr: () =>
      isGood
        ? `ARR expands by ${absPct.toFixed(1)}%, strengthening recurring revenue base.${absPct > 25 ? " This scale shift could justify higher valuation multiples." : ""}`
        : `ARR contracts ${absPct.toFixed(1)}%. ${absPct > 15 ? "Recurring revenue erosion requires immediate attention." : "Minor ARR pressure — likely recoverable with execution focus."}`,
    cash: () =>
      isGood
        ? `Cash position improves by ${absPct.toFixed(1)}%, extending operational runway. ${absPct > 30 ? "Materially reduces capital constraint risk." : ""}`
        : `Cash position weakens ${absPct.toFixed(1)}%. ${absPct > 25 ? "Capital preservation measures should be evaluated." : "Monitor closely but within tolerance."}`,
    burn: () =>
      isGood
        ? `Burn rate decreases ${absPct.toFixed(1)}% — improved capital efficiency. ${absPct > 20 ? "This meaningfully extends runway without external capital." : ""}`
        : `Burn increases ${absPct.toFixed(1)}% under Scenario B. ${absPct > 30 ? "Elevated burn at this rate compresses runway and increases funding dependency." : "Controlled investment — verify ROI assumptions."}`,
    runway: () =>
      isGood
        ? `Runway extends by ${Math.abs(delta).toFixed(0)} months. ${Math.abs(delta) > 6 ? "Materially reduces time pressure on fundraising." : "Incremental improvement."}`
        : `Runway shortens by ${Math.abs(delta).toFixed(0)} months. ${Math.abs(delta) > 6 ? "This compression warrants urgent capital planning." : "Manageable reduction if offset by growth."}`,
    grossMargin: () =>
      isGood
        ? `Gross margin improves ${Math.abs(delta).toFixed(1)}pp. ${Math.abs(delta) > 5 ? "Meaningful unit-economics improvement." : "Marginal but directionally positive."}`
        : `Gross margin declines ${Math.abs(delta).toFixed(1)}pp. ${Math.abs(delta) > 10 ? "Structural margin pressure — review COGS assumptions." : "Monitor for trend."}`,
    growthRate: () =>
      isGood
        ? `Growth accelerates ${absPct.toFixed(1)}%. ${absPct > 20 ? "Step-change in trajectory — validate with cohort data." : "Steady compounding advantage."}`
        : `Growth decelerates ${absPct.toFixed(1)}%. ${absPct > 30 ? "Significant deceleration — may indicate market saturation or execution friction." : "Moderate slowdown within planning range."}`,
    churnRate: () =>
      isGood
        ? `Churn improves (decreases) — net retention strengthens. ${absPct > 15 ? "Strong retention signal — this compounds materially over time." : ""}`
        : `Churn increases under Scenario B. ${absPct > 25 ? "Elevated churn erodes LTV and may indicate product-market fit issues." : "Watch for trend but within bounds."}`,
    headcount: () =>
      delta > 0
        ? `Headcount increases by ${Math.abs(delta).toFixed(0)}. Ensure revenue-per-head efficiency is maintained.`
        : delta < 0
          ? `Headcount decreases by ${Math.abs(delta).toFixed(0)}. Leaner team — verify capacity against growth targets.`
          : "Headcount unchanged between scenarios.",
    arpa: () =>
      isGood
        ? `ARPA improves ${absPct.toFixed(1)}% — stronger per-account monetisation. ${absPct > 20 ? "Pricing or expansion strategy is working." : ""}`
        : `ARPA declines ${absPct.toFixed(1)}%. ${absPct > 15 ? "Downward pricing pressure — review mix and packaging." : "Minor shift — may reflect segment mix change."}`,
    risk: () =>
      isGood
        ? `Risk score improves by ${Math.abs(delta).toFixed(0)}pts — scenario exhibits lower structural risk. ${Math.abs(delta) > 15 ? "Materially de-risked position." : ""}`
        : `Risk score deteriorates by ${Math.abs(delta).toFixed(0)}pts. ${Math.abs(delta) > 20 ? "Significant risk increase demands mitigation planning." : "Elevated but manageable."}`,
  }

  return (commentary[key] ?? (() => `Delta: ${delta > 0 ? "+" : ""}${delta.toFixed(1)}. ${magnitude} change.`))()
}

// ── Table Row ──

interface RowData {
  metric: MetricDef
  valA: number | null
  valB: number | null
  delta: number
  pctChange: number | null
  commentary: string
}

// ── Component ──

const CompareTableView: React.FC<CompareTableViewProps> = memo(({
  kpisA,
  kpisB,
  labelA,
  labelB,
}) => {
  const rows = useMemo<RowData[]>(() =>
    METRICS.map((m) => {
      const valA = kpisA ? m.extract(kpisA) : null
      const valB = kpisB ? m.extract(kpisB) : null
      const delta = (valB ?? 0) - (valA ?? 0)
      const pctChange = valA && valA !== 0 ? (delta / Math.abs(valA)) * 100 : null
      const commentary = generateCommentary(m.key, valA, valB, m.upIsGood)
      return { metric: m, valA, valB, delta, pctChange, commentary }
    }),
    [kpisA, kpisB],
  )

  const hasData = kpisA != null && kpisB != null

  return (
    <div style={S.container}>
      {/* Header */}
      <div style={S.tableHeader}>
        <div style={{ ...S.headerCell, flex: 1.6 }}>Metric</div>
        <div style={{ ...S.headerCell, flex: 1, textAlign: "right" }}>{labelA}</div>
        <div style={{ ...S.headerCell, flex: 1, textAlign: "right" }}>{labelB}</div>
        <div style={{ ...S.headerCell, flex: 0.8, textAlign: "right" }}>Δ Delta</div>
        <div style={{ ...S.headerCell, flex: 0.6, textAlign: "right" }}>Δ %</div>
        <div style={{ ...S.headerCell, flex: 2.5 }}>AI Commentary</div>
      </div>

      {/* Rows */}
      <div style={S.tableBody}>
        {rows.map((row, idx) => {
          const isPositive = row.metric.upIsGood
            ? row.delta > 0.001
            : row.delta < -0.001
          const isNegative = row.metric.upIsGood
            ? row.delta < -0.001
            : row.delta > 0.001
          const isFlat = !isPositive && !isNegative

          const deltaColor = isFlat
            ? "rgba(148,180,214,0.4)"
            : isPositive
              ? "rgba(34,197,94,0.9)"
              : "rgba(239,68,68,0.9)"

          const rowBg = idx % 2 === 0
            ? "rgba(255,255,255,0.02)"
            : "transparent"

          const glowBorder = isFlat
            ? "1px solid rgba(255,255,255,0.04)"
            : isPositive
              ? "1px solid rgba(34,197,94,0.08)"
              : "1px solid rgba(239,68,68,0.08)"

          const formatDelta = () => {
            if (!hasData) return "—"
            const d = row.delta
            const sign = d > 0 ? "+" : ""
            if (row.metric.unit === "$") return `${sign}${fmtCurrency(d).replace("$", "$")}`
            if (row.metric.unit === "mo") return `${sign}${Math.round(d)}mo`
            if (row.metric.unit === "%") return `${sign}${d.toFixed(1)}${row.metric.key === "growthRate" || row.metric.key === "churnRate" ? "pp" : "pp"}`
            if (row.metric.unit === "pts") return `${sign}${d.toFixed(0)}pts`
            return `${sign}${d.toFixed(0)}`
          }

          const formatPct = () => {
            if (!hasData || row.pctChange == null) return "—"
            const sign = row.pctChange > 0 ? "+" : ""
            return `${sign}${row.pctChange.toFixed(1)}%`
          }

          return (
            <div
              key={row.metric.key}
              style={{
                ...S.row,
                background: rowBg,
                borderBottom: glowBorder,
              }}
            >
              {/* Metric name */}
              <div style={{ ...S.cell, flex: 1.6 }}>
                <span style={S.metricLabel}>{row.metric.label}</span>
              </div>

              {/* Value A */}
              <div style={{ ...S.cell, flex: 1, textAlign: "right" }}>
                <span style={S.valueText}>
                  {kpisA ? row.metric.format(row.valA) : "—"}
                </span>
              </div>

              {/* Value B */}
              <div style={{ ...S.cell, flex: 1, textAlign: "right" }}>
                <span style={{ ...S.valueText, color: "rgba(226,240,255,0.85)" }}>
                  {kpisB ? row.metric.format(row.valB) : "—"}
                </span>
              </div>

              {/* Delta */}
              <div style={{ ...S.cell, flex: 0.8, textAlign: "right" }}>
                <span style={{ ...S.deltaText, color: deltaColor }}>
                  {formatDelta()}
                </span>
              </div>

              {/* % Change */}
              <div style={{ ...S.cell, flex: 0.6, textAlign: "right" }}>
                <span style={{ ...S.pctText, color: deltaColor }}>
                  {formatPct()}
                </span>
              </div>

              {/* Commentary */}
              <div style={{ ...S.cell, flex: 2.5 }}>
                <span style={S.commentary}>{row.commentary}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer summary */}
      {hasData && (
        <div style={S.footer}>
          <span style={S.footerIcon}>◇</span>
          <span style={S.footerText}>
            {(() => {
              const positiveCount = rows.filter((r) => r.metric.upIsGood ? r.delta > 0.001 : r.delta < -0.001).length
              const negativeCount = rows.filter((r) => r.metric.upIsGood ? r.delta < -0.001 : r.delta > 0.001).length
              if (positiveCount > negativeCount + 2) return "Scenario B shows broad-based improvement across key metrics."
              if (negativeCount > positiveCount + 2) return "Scenario B weakens most structural indicators — review risk trade-offs."
              return "Mixed variance profile — evaluate which metric shifts matter most for your strategic context."
            })()}
          </span>
        </div>
      )}
    </div>
  )
})

CompareTableView.displayName = "CompareTableView"
export default CompareTableView

/* ── Styles ── */

const FONT = "'Inter', system-ui, sans-serif"
const MONO = "ui-monospace, 'JetBrains Mono', monospace"

const S: Record<string, React.CSSProperties> = {
  container: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    background: "rgba(2,8,20,0.95)",
    backdropFilter: "blur(16px)",
  },

  tableHeader: {
    display: "flex",
    alignItems: "center",
    padding: "10px 20px",
    borderBottom: "1px solid rgba(34,211,238,0.12)",
    background: "rgba(0,0,0,0.4)",
    flexShrink: 0,
  },

  headerCell: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "rgba(34,211,238,0.6)",
    fontFamily: FONT,
    padding: "0 8px",
  },

  tableBody: {
    flex: 1,
    overflowY: "auto" as const,
    overflowX: "hidden" as const,
    scrollbarWidth: "thin" as const,
    scrollbarColor: "rgba(34,211,238,0.12) transparent",
  },

  row: {
    display: "flex",
    alignItems: "flex-start",
    padding: "10px 20px",
    transition: "background 150ms ease",
    minHeight: 52,
  },

  cell: {
    padding: "0 8px",
    display: "flex",
    alignItems: "flex-start",
  },

  metricLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "rgba(226,240,255,0.8)",
    fontFamily: FONT,
    letterSpacing: "0.02em",
  },

  valueText: {
    fontSize: 12,
    fontWeight: 500,
    color: "rgba(148,180,214,0.6)",
    fontFamily: MONO,
    letterSpacing: "-0.02em",
  },

  deltaText: {
    fontSize: 12,
    fontWeight: 700,
    fontFamily: MONO,
    letterSpacing: "-0.02em",
  },

  pctText: {
    fontSize: 11,
    fontWeight: 600,
    fontFamily: MONO,
    letterSpacing: "-0.02em",
  },

  commentary: {
    fontSize: 11,
    fontWeight: 400,
    color: "rgba(148,180,214,0.55)",
    fontFamily: FONT,
    lineHeight: 1.55,
    letterSpacing: "0.01em",
  },

  footer: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 20px",
    borderTop: "1px solid rgba(34,211,238,0.08)",
    background: "rgba(0,0,0,0.3)",
    flexShrink: 0,
  },

  footerIcon: {
    fontSize: 12,
    color: "rgba(34,211,238,0.5)",
  },

  footerText: {
    fontSize: 11,
    fontWeight: 500,
    color: "rgba(148,180,214,0.55)",
    fontFamily: FONT,
    fontStyle: "italic",
    lineHeight: 1.5,
  },
}
