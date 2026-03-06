/**
 * ScenarioInterpretationCard — displays how STRATFIT interprets a user's
 * scenario prompt before running the simulation. Makes assumptions
 * transparent and lets the user confirm or adjust before terrain updates.
 */

import React, { memo, useCallback, useMemo, useState } from "react"
import type { ScenarioTemplate, ScenarioCategory } from "@/engine/scenarioTemplates"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"
import type { DetectedIntent } from "@/engine/scenarioIntentDetector"

export interface ScenarioInterpretation {
  template: ScenarioTemplate
  intent: DetectedIntent | null
  confidence: number
}

interface Props {
  interpretation: ScenarioInterpretation
  onConfirm: (template: ScenarioTemplate) => void
  onCancel: () => void
}

const CATEGORY_LABELS: Record<ScenarioCategory, string> = {
  hiring: "Team Expansion",
  pricing: "Pricing Strategy",
  capital: "Capital Event",
  growth: "Growth Initiative",
  efficiency: "Operational Efficiency",
  market: "Market Dynamics",
  risk: "Risk Event",
}

const CATEGORY_COLORS: Record<ScenarioCategory, string> = {
  hiring: "rgba(168,85,247,0.85)",
  pricing: "rgba(34,211,153,0.85)",
  capital: "rgba(59,130,246,0.85)",
  growth: "rgba(52,211,238,0.85)",
  efficiency: "rgba(96,165,250,0.85)",
  market: "rgba(251,146,60,0.85)",
  risk: "rgba(255,78,128,0.85)",
}

const KPI_LABELS: Partial<Record<KpiKey, string>> = {
  cash: "Liquidity",
  runway: "Runway",
  growth: "Growth",
  arr: "ARR",
  revenue: "Revenue",
  burn: "Burn",
  churn: "Churn",
  grossMargin: "Margin",
  headcount: "Headcount",
  enterpriseValue: "Enterprise Value",
}

function formatForce(kpi: KpiKey, v: number): string {
  const abs = Math.abs(v)
  const sign = v > 0 ? "+" : "-"
  if (["cash", "revenue", "burn", "arr", "enterpriseValue"].includes(kpi)) {
    if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`
    if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`
    return `${sign}$${abs}`
  }
  if (["churn", "growth", "grossMargin"].includes(kpi)) return `${v > 0 ? "+" : ""}${v}%`
  return `${v > 0 ? "+" : ""}${v}`
}

function confidenceLabel(score: number): string {
  if (score >= 0.8) return "High"
  if (score >= 0.5) return "Medium"
  return "Low"
}

function confidenceColor(score: number): string {
  if (score >= 0.8) return "rgba(52,211,153,0.85)"
  if (score >= 0.5) return "rgba(251,191,36,0.85)"
  return "rgba(248,113,113,0.85)"
}

const ScenarioInterpretationCard: React.FC<Props> = memo(({
  interpretation,
  onConfirm,
  onCancel,
}) => {
  const { template, intent, confidence } = interpretation
  const [editedForces, setEditedForces] = useState<Partial<Record<KpiKey, number>>>({ ...template.forces })
  const [horizon, setHorizon] = useState(12)

  const forceEntries = useMemo(
    () => Object.entries(editedForces) as [KpiKey, number][],
    [editedForces],
  )

  const handleForceChange = useCallback((kpi: KpiKey, value: string) => {
    const num = parseFloat(value)
    if (!isNaN(num)) {
      setEditedForces((prev) => ({ ...prev, [kpi]: num }))
    }
  }, [])

  const handleConfirm = useCallback(() => {
    onConfirm({ ...template, forces: editedForces })
  }, [template, editedForces, onConfirm])

  const catColor = CATEGORY_COLORS[template.category] ?? "rgba(108,198,255,0.7)"

  return (
    <div style={S.overlay}>
      <div style={S.card}>
        {/* ── Column 1: Scenario info ── */}
        <div style={S.colInfo}>
          <div style={S.cardTitle}>Scenario Interpretation</div>
          <div style={S.cardSubtitle}>STRATFIT has structured your scenario as follows.</div>

          <div style={S.fieldBlock}>
            <div style={S.fieldLabel}>Strategic Action</div>
            <div style={S.question}>{template.question}</div>
          </div>

          <div style={S.fieldBlock}>
            <div style={S.fieldLabel}>Primary Objective</div>
            <div style={S.description}>{template.description}</div>
          </div>

          <div style={S.header}>
            <span style={{ ...S.categoryBadge, background: catColor }}>
              {CATEGORY_LABELS[template.category] ?? template.category}
            </span>
            <span style={{ ...S.confidenceBadge, color: confidenceColor(confidence) }}>
              {confidenceLabel(confidence)}
            </span>
          </div>

          {intent && (
            <div style={S.intentRow}>
              <span style={S.intentLabel}>Detected Keywords</span>
              {intent.detectedKeywords.length > 0 && (
                <span style={S.keywords}>
                  {intent.detectedKeywords.map((kw) => (
                    <span key={kw} style={S.keyword}>{kw}</span>
                  ))}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Column 2: KPI impacts ── */}
        <div style={S.colKpi}>
          <div style={S.sectionLabel}>Affected Business Drivers</div>
          <div style={S.forceGrid}>
            {forceEntries.map(([kpi, val]) => (
              <div key={kpi} style={S.forceRow}>
                <span style={S.forceKpi}>{KPI_LABELS[kpi] ?? kpi}</span>
                <input
                  type="number"
                  value={val}
                  onChange={(e) => handleForceChange(kpi, e.target.value)}
                  style={{
                    ...S.forceInput,
                    color: val > 0 ? "rgba(52,211,153,0.9)" : val < 0 ? "rgba(248,113,113,0.9)" : "rgba(200,220,240,0.7)",
                  }}
                />
                <span style={{
                  ...S.forcePreview,
                  color: val > 0 ? "rgba(52,211,153,0.65)" : "rgba(248,113,113,0.65)",
                }}>
                  {formatForce(kpi, val)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Column 3: Horizon + actions ── */}
        <div style={S.colAction}>
          <div style={S.horizonRow}>
            <span style={S.sectionLabel}>Simulation Horizon</span>
            <div style={S.horizonOptions}>
              {[3, 6, 12, 24].map((m) => (
                <button
                  key={m}
                  onClick={() => setHorizon(m)}
                  style={{
                    ...S.horizonBtn,
                    ...(horizon === m ? S.horizonBtnActive : {}),
                  }}
                >
                  {m}M
                </button>
              ))}
            </div>
          </div>
          <div style={S.actionBar}>
            <button onClick={onCancel} style={S.editBtn}>Edit</button>
            <button
              onClick={handleConfirm}
              style={S.runBtnCard}
              onMouseEnter={(e) => {
                ;(e.currentTarget.style.boxShadow = "0 0 18px rgba(108,198,255,0.35)")
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget.style.boxShadow = "0 0 8px rgba(60,160,255,0.12)")
              }}
            >
              Confirm &amp; Simulate
            </button>
          </div>
          <button onClick={onCancel} style={S.closeBtn} aria-label="Cancel">✕</button>
        </div>
      </div>
    </div>
  )
})

ScenarioInterpretationCard.displayName = "ScenarioInterpretationCard"
export default ScenarioInterpretationCard

/* ═══════════════════════════════════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════════════════════════════════ */

const FONT = "'Inter', system-ui, sans-serif"

const S: Record<string, React.CSSProperties> = {
  overlay: {
    width: "100%",
    maxWidth: 1500,
    margin: "6px auto 0",
  },

  card: {
    width: "100%",
    maxHeight: "35vh",
    overflowY: "auto",
    background: "linear-gradient(135deg, rgba(10,16,28,0.92) 0%, rgba(8,12,22,0.96) 100%)",
    border: "1px solid rgba(80,140,255,0.22)",
    borderRadius: 10,
    boxShadow: "0 4px 24px rgba(0,0,0,0.35), 0 0 18px rgba(40,120,255,0.06)",
    padding: "0",
    fontFamily: FONT,
    scrollbarWidth: "thin" as const,
    scrollbarColor: "rgba(80,140,255,0.1) transparent",
    display: "grid",
    gridTemplateColumns: "1fr 1fr auto",
    gridTemplateRows: "auto",
  },

  cardTitle: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "rgba(80,140,255,0.55)",
    marginBottom: 2,
  },

  cardSubtitle: {
    fontSize: 10,
    color: "rgba(200,220,240,0.35)",
    marginBottom: 8,
    lineHeight: 1.45,
  },

  fieldBlock: {
    marginBottom: 6,
  },

  fieldLabel: {
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "rgba(80,140,255,0.4)",
    marginBottom: 2,
  },

  colInfo: {
    padding: "12px 16px",
    borderRight: "1px solid rgba(80,140,255,0.08)",
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
    overflow: "hidden",
  },

  colKpi: {
    padding: "12px 14px",
    borderRight: "1px solid rgba(80,140,255,0.08)",
    overflow: "auto",
  },

  colAction: {
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "space-between",
    position: "relative" as const,
    minWidth: 150,
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },

  categoryBadge: {
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    padding: "2px 8px",
    borderRadius: 3,
    color: "#fff",
  },

  confidenceBadge: {
    fontSize: 8,
    fontWeight: 600,
    letterSpacing: "0.06em",
  },

  closeBtn: {
    position: "absolute" as const,
    top: 6,
    right: 6,
    background: "none",
    border: "none",
    color: "rgba(200,220,240,0.3)",
    fontSize: 12,
    cursor: "pointer",
    padding: "2px 4px",
    lineHeight: 1,
  },

  question: {
    fontSize: 13,
    fontWeight: 600,
    color: "rgba(220,235,250,0.92)",
    lineHeight: 1.35,
  },

  description: {
    fontSize: 10,
    color: "rgba(160,185,210,0.55)",
    lineHeight: 1.45,
  },

  intentRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap" as const,
    marginTop: 4,
  },

  intentLabel: {
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "rgba(80,140,255,0.5)",
  },

  intentValue: {
    fontSize: 10,
    color: "rgba(200,220,240,0.75)",
    fontWeight: 500,
  },

  keywords: {
    display: "flex",
    gap: 3,
    flexWrap: "wrap" as const,
  },

  keyword: {
    fontSize: 8,
    padding: "1px 5px",
    borderRadius: 3,
    background: "rgba(80,140,255,0.1)",
    color: "rgba(127,200,255,0.6)",
    border: "1px solid rgba(80,140,255,0.12)",
  },

  sectionLabel: {
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "rgba(80,140,255,0.45)",
    marginBottom: 6,
  },

  forceGrid: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
  },

  forceRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "2px 0",
  },

  forceKpi: {
    fontSize: 10,
    color: "rgba(200,220,240,0.65)",
    width: 90,
    flexShrink: 0,
  },

  forceInput: {
    width: 60,
    background: "rgba(15,20,35,0.6)",
    border: "1px solid rgba(80,140,255,0.15)",
    borderRadius: 3,
    padding: "2px 6px",
    fontSize: 10,
    fontFamily: FONT,
    outline: "none",
    textAlign: "right" as const,
  },

  forcePreview: {
    fontSize: 9,
    fontWeight: 500,
    width: 60,
    textAlign: "right" as const,
  },

  horizonRow: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
    marginBottom: 8,
  },

  horizonOptions: {
    display: "flex",
    gap: 3,
  },

  horizonBtn: {
    background: "rgba(15,20,35,0.5)",
    border: "1px solid rgba(80,140,255,0.12)",
    borderRadius: 3,
    padding: "3px 10px",
    fontSize: 9,
    fontWeight: 600,
    color: "rgba(200,220,240,0.5)",
    cursor: "pointer",
    fontFamily: FONT,
    transition: "all 180ms ease",
  },

  horizonBtnActive: {
    background: "rgba(60,160,255,0.15)",
    borderColor: "rgba(108,198,255,0.4)",
    color: "rgba(108,198,255,0.9)",
  },

  actionBar: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },

  editBtn: {
    background: "none",
    border: "1px solid rgba(200,220,240,0.12)",
    borderRadius: 5,
    padding: "6px 14px",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    color: "rgba(200,220,240,0.45)",
    cursor: "pointer",
    fontFamily: FONT,
    transition: "all 180ms ease",
    textAlign: "center" as const,
  },

  runBtnCard: {
    background: "linear-gradient(90deg, #3ca0ff, #6cd4ff)",
    border: "none",
    borderRadius: 5,
    padding: "8px 16px",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "#fff",
    cursor: "pointer",
    fontFamily: FONT,
    boxShadow: "0 0 8px rgba(60,160,255,0.12)",
    transition: "box-shadow 250ms ease",
    textAlign: "center" as const,
  },
}
