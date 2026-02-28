// src/components/cinematic/CinematicIntelligencePanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Cinematic Intelligence Panel (Dual Mode: Overlay → Dock)
//
// Single component that renders intelligence rows with row-by-row typewriter.
// Two mount points: terrain overlay (emerge) and right rail (settled).
// Content source: canonical selectors → buildAIInsight() — no UI calculations.
//
// Phases (from useIntelligencePresentation):
//   idle     → nothing visible
//   emerge   → overlay on terrain, typewriter active, glow pulse
//   dock     → transitioning from overlay to rail
//   settled  → static in right rail, full content, no cursor
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore"
import { useBaselineStore } from "@/state/baselineStore"
import { selectKpis, selectKpiDeltas } from "@/selectors/kpiSelectors"
import { selectRiskScore } from "@/selectors/riskSelectors"
import { selectDrivers } from "@/selectors/driverSelectors"
import { buildAIInsight } from "@/engine/aiInsightBuilder"
import type { AIInsightOutput } from "@/engine/aiInsightBuilder"
import { useRowTypewriter } from "@/hooks/useRowTypewriter"
import { selectIntentOrderedRows } from "@/engine/intentTemplates"
import type { IntelligencePhase } from "@/hooks/useIntelligencePresentation"

/* ── Props ── */
interface CinematicIntelligencePanelProps {
  phase: IntelligencePhase
  onTypewriterComplete: () => void
}

/* ── Row extraction — formatting only, no new calculations ── */
function extractRows(insight: AIInsightOutput): string[] {
  const rows: string[] = []

  // Row 1: Executive summary
  rows.push(insight.executiveSummary)

  // Row 2–4: Key drivers (top 3)
  const topDrivers = insight.keyDrivers.slice(0, 3)
  for (const d of topDrivers) {
    const arrow = d.tone === "positive" ? "▲" : d.tone === "negative" ? "▼" : "◆"
    rows.push(`${arrow} ${d.label} — ${d.impact}`)
  }

  // Row 5: Risk narrative
  rows.push(insight.riskNarrative)

  // Row 6: Top probability signal
  if (insight.probabilitySignals.length > 0) {
    const top = insight.probabilitySignals[0]
    rows.push(`#${top.rank} ${top.title} — ${top.probability}% — ${top.interpretation}`)
  }

  return rows
}

/* ── Component ── */
const CinematicIntelligencePanel: React.FC<CinematicIntelligencePanelProps> = memo(({
  phase,
  onTypewriterComplete,
}) => {
  const activeScenarioId = usePhase1ScenarioStore((s) => s.activeScenarioId)
  const scenarios = usePhase1ScenarioStore((s) => s.scenarios)
  const baseline = useBaselineStore((s) => s.baseline)

  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === activeScenarioId) ?? null,
    [scenarios, activeScenarioId],
  )

  // Build baseline KPIs
  const baselineKpis = useMemo(() => {
    if (!baseline) return null
    return selectKpis({
      cash: baseline.cash ?? 0,
      monthlyBurn: baseline.monthlyBurn ?? 0,
      revenue: baseline.revenue ?? 0,
      grossMargin: baseline.grossMargin ?? 0,
      growthRate: baseline.growthRate ?? 0,
      churnRate: baseline.churnRate ?? 0,
      headcount: baseline.headcount ?? 0,
      arpa: baseline.arpa ?? 0,
      runway: (baseline.monthlyBurn ?? 0) > 0
        ? Math.round((baseline.cash ?? 0) / (baseline.monthlyBurn ?? 1))
        : null,
    })
  }, [baseline])

  // Build scenario KPIs from simulation results
  const scenarioKpis = useMemo(
    () => selectKpis(activeScenario?.simulationResults?.kpis ?? null),
    [activeScenario?.simulationResults?.kpis],
  )

  // Derive intelligence rows via canonical selectors → buildAIInsight
  const insight: AIInsightOutput | null = useMemo(() => {
    if (!baselineKpis || !scenarioKpis || !activeScenario?.simulationResults) return null
    if (activeScenario.status !== "complete") return null

    const deltas = selectKpiDeltas(baselineKpis, scenarioKpis)
    if (!deltas) return null

    const riskScore = selectRiskScore(activeScenario.simulationResults.kpis)
    const drivers = selectDrivers(baselineKpis, scenarioKpis, deltas)

    return buildAIInsight({
      decisionQuestion: activeScenario.decision,
      baselineKpis,
      scenarioKpis,
      deltaKpis: deltas,
      riskScore,
      drivers,
    })
  }, [baselineKpis, scenarioKpis, activeScenario])

  const baseRows = useMemo(() => insight ? extractRows(insight) : [], [insight])
  const intentType = activeScenario?.decisionIntentType
  const rows = useMemo(
    () => selectIntentOrderedRows(intentType, baseRows),
    [intentType, baseRows],
  )

  const riskScore = useMemo(
    () => selectRiskScore(activeScenario?.simulationResults?.kpis ?? null),
    [activeScenario?.simulationResults?.kpis],
  )

  // Typewriter: active during reveal phase only
  const typewriterActive = phase === "reveal"
  const showContent = phase === "reveal" || phase === "settled"

  const { renderedRows, isDone } = useRowTypewriter(rows, {
    charDelayMs: 18,
    rowPauseMs: 340,
    start: typewriterActive,
    onComplete: onTypewriterComplete,
  })

  // In settled, show full rows
  const displayRows = phase === "settled" ? rows : renderedRows

  const isVisible = showContent && rows.length > 0

  // Risk color
  const riskColor = riskScore >= 78 ? "rgba(52,211,153,0.9)"
    : riskScore >= 60 ? "rgba(251,191,36,0.9)"
    : riskScore >= 45 ? "rgba(99,102,241,0.9)"
    : "rgba(239,68,68,0.9)"

  // Decision header
  const decisionQuestion = activeScenario?.decision ?? null
  const intentLabel = activeScenario?.decisionIntentLabel ?? null

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="cinematic-intel"
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          style={{
            ...GLASS_PANEL,
            boxShadow: phase === "reveal"
              ? "0 0 40px rgba(34,211,238,0.12), 0 0 80px rgba(34,211,238,0.06), 0 8px 32px rgba(0,0,0,0.5)"
              : "0 4px 24px rgba(0,0,0,0.4)",
          }}
        >
          {/* Reveal glow pulse */}
          {phase === "reveal" && (
            <div style={GLOW_PULSE} aria-hidden="true" />
          )}

          {/* Header */}
          <div style={HEADER}>
            <div style={HEADER_TITLE}>
              {decisionQuestion
                ? <>Decision Insight &mdash; <span style={{ color: "#22d3ee", fontWeight: 400, fontStyle: "italic", fontSize: 11 }}>{decisionQuestion.length > 60 ? decisionQuestion.slice(0, 60) + "…" : decisionQuestion}</span></>
                : "Scenario Insight"
              }
            </div>
            {intentLabel && (
              <div style={HEADER_SUB}>
                Based on <span style={{ color: "rgba(34,211,238,0.65)" }}>{intentLabel}</span> scenario outcomes
              </div>
            )}
          </div>

          {/* Intelligence rows */}
          <div style={ROWS_CONTAINER}>
            {displayRows.map((text, idx) => {
              if (!text) return null
              const isFirst = idx === 0
              const isDriver = idx >= 1 && idx <= 3
              const isRisk = idx === rows.length - 2
              const isSignal = idx === rows.length - 1

              // Row label
              let label = ""
              if (isFirst) label = "EXECUTIVE SUMMARY"
              else if (isDriver && idx === 1) label = "KEY DRIVERS"
              else if (isRisk) label = "RISK ASSESSMENT"
              else if (isSignal) label = "TOP SIGNAL"

              return (
                <div key={idx} style={ROW}>
                  {label && <div style={ROW_LABEL}>{label}</div>}
                  <div style={{
                    ...ROW_TEXT,
                    color: isDriver
                      ? (text.startsWith("▲") ? "rgba(52,211,153,0.9)" : text.startsWith("▼") ? "rgba(239,68,68,0.85)" : "rgba(255,255,255,0.75)")
                      : "rgba(255,255,255,0.78)",
                    fontSize: isFirst ? 13 : 12,
                    fontWeight: isFirst ? 500 : 400,
                  }}>
                    {text}
                    {/* Blinking cursor on current typing row */}
                    {phase === "reveal" && !isDone && idx === renderedRows.findIndex((r, i) => i >= rowIdxFromRendered(renderedRows, rows)) && (
                      <span style={CURSOR}>▎</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer — survival probability */}
          {(phase === "settled" || isDone) && (
            <div style={FOOTER}>
              <span style={{ opacity: 0.5 }}>Survival probability:</span>{" "}
              <span style={{ color: riskColor, fontWeight: 600 }}>{riskScore}/100</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
})

/** Find which row index is currently being typed */
function rowIdxFromRendered(rendered: string[], full: string[]): number {
  for (let i = 0; i < rendered.length; i++) {
    if (rendered[i].length < (full[i]?.length ?? 0)) return i
  }
  return rendered.length - 1
}

/* ═══ Style tokens ═══ */

const GLASS_PANEL: React.CSSProperties = {
  position: "relative",
  background: "rgba(10,14,18,0.55)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(120,220,255,0.18)",
  borderRadius: 12,
  padding: "16px 18px 14px",
  overflow: "hidden",
}

const GLOW_PULSE: React.CSSProperties = {
  position: "absolute",
  inset: -1,
  borderRadius: 12,
  border: "1px solid rgba(34,211,238,0.25)",
  boxShadow: "0 0 20px rgba(34,211,238,0.08)",
  animation: "cintelGlow 2.4s ease-in-out infinite",
  pointerEvents: "none",
}

const HEADER: React.CSSProperties = {
  marginBottom: 12,
  paddingBottom: 10,
  borderBottom: "1px solid rgba(255,255,255,0.06)",
}

const HEADER_TITLE: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "rgba(255,255,255,0.7)",
}

const HEADER_SUB: React.CSSProperties = {
  fontSize: 11,
  color: "rgba(255,255,255,0.35)",
  marginTop: 3,
  letterSpacing: "0.04em",
}

const ROWS_CONTAINER: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
}

const ROW: React.CSSProperties = {}

const ROW_LABEL: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "rgba(34,211,238,0.55)",
  marginBottom: 3,
}

const ROW_TEXT: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.55,
  fontFamily: "'Inter', system-ui, sans-serif",
}

const CURSOR: React.CSSProperties = {
  color: "#22d3ee",
  animation: "cintelBlink 0.6s steps(2) infinite",
  marginLeft: 1,
  fontWeight: 300,
}

const FOOTER: React.CSSProperties = {
  marginTop: 12,
  paddingTop: 10,
  borderTop: "1px solid rgba(255,255,255,0.06)",
  fontSize: 11,
  color: "rgba(255,255,255,0.5)",
  letterSpacing: "0.04em",
}

CinematicIntelligencePanel.displayName = "CinematicIntelligencePanel"
export default CinematicIntelligencePanel

/** Keyframe styles — injected once */
export const CINEMATIC_INTEL_KEYFRAMES = `
@keyframes cintelGlow {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
@keyframes cintelBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
`
