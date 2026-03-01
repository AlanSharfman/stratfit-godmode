// src/components/intelligence/CommandGlassPanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Command Glass Panel (Right Rail Only)
//
// Premium intelligence output panel — single mount point in the right rail.
// No overlay mode. No dual-mode complexity.
//
// Visual signature:
//   • Glass panel with refraction blur + bevel highlight
//   • Specular sweep — diagonal light wipe on reveal
//   • Film grain texture overlay (subtle, no perf cost)
//   • Row-by-row typewriter during reveal phase
//   • Calm framer-motion entrance (no bounce/spring)
//
// Phases (from useIntelligencePresentation):
//   idle    → AIInsightPanel shown instead (fallback)
//   reveal  → typewriter active, specular sweep, glow
//   settled → static content, full rows, no cursor
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
interface CommandGlassPanelProps {
  phase: IntelligencePhase
  onTypewriterComplete: () => void
}

/* ── Row extraction — formatting only, no calculations ── */
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

  // Row 6+: All probability signals with %
  for (const sig of insight.probabilitySignals) {
    rows.push(`⚡ ${sig.title} — ${sig.probability}% probability — ${sig.interpretation}`)
  }

  return rows
}

/* ── Component ── */
const CommandGlassPanel: React.FC<CommandGlassPanelProps> = memo(({
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
    charDelayMs: 35,
    rowPauseMs: 600,
    start: typewriterActive,
    onComplete: onTypewriterComplete,
  })

  // In settled, show full rows; in reveal, typewriter rows
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
    <>
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            key="command-glass"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.55, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={GLASS_PANEL}
          >
            {/* ── Specular sweep — diagonal light wipe ── */}
            {phase === "reveal" && (
              <div style={SPECULAR_SWEEP} aria-hidden="true" />
            )}

            {/* ── Film grain texture ── */}
            <div style={FILM_GRAIN} aria-hidden="true" />

            {/* ── Bevel highlight (top edge) ── */}
            <div style={BEVEL_HIGHLIGHT} aria-hidden="true" />

            {/* ── Reveal glow border ── */}
            {phase === "reveal" && (
              <div style={REVEAL_GLOW} aria-hidden="true" />
            )}

            {/* Header */}
            <div style={HEADER}>
              <div style={HEADER_TITLE}>
                {decisionQuestion
                  ? <>Strategic Insight &mdash; <span style={HEADER_QUESTION}>{decisionQuestion.length > 55 ? decisionQuestion.slice(0, 55) + "…" : decisionQuestion}</span></>
                  : "STRATFIT INSIGHTS"
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
                const isRisk = idx === rows.length - 2 || text.includes("risk") || text.includes("Risk")
                const isSignal = text.startsWith("⚡")
                const isConcern = text.startsWith("▼") || isRisk

                // Row label
                let label = ""
                if (isFirst) label = "EXECUTIVE SUMMARY"
                else if (isDriver && idx === 1) label = "KEY DRIVERS"
                else if (isRisk && !isSignal) label = "RISK ASSESSMENT"
                else if (isSignal && (idx === 4 || (idx > 3 && !rows[idx - 1]?.startsWith("⚡")))) label = "PROBABILITY SIGNALS"

                return (
                  <div key={idx} style={{
                    ...ROW,
                    ...(isConcern ? CONCERN_ROW : {}),
                  }}>
                    {label && <div style={ROW_LABEL}>{label}</div>}
                    <div style={{
                      ...ROW_TEXT,
                      color: isDriver
                        ? (text.startsWith("▲") ? "rgba(52,211,153,0.95)" : text.startsWith("▼") ? "rgba(239,68,68,0.95)" : "rgba(255,255,255,0.82)")
                        : isSignal ? "rgba(251,191,36,0.92)"
                        : isConcern ? "rgba(239,68,68,0.88)"
                        : "rgba(255,255,255,0.82)",
                      fontSize: isFirst ? 13.5 : 12.5,
                      fontWeight: isFirst ? 600 : isSignal ? 500 : 400,
                      lineHeight: 1.65,
                    }}>
                      {text}
                      {/* Blinking cursor on active typing row */}
                      {phase === "reveal" && !isDone && idx === findTypingRow(renderedRows, rows) && (
                        <span style={CURSOR}>▎</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer — survival probability with % */}
            {(phase === "settled" || isDone) && (
              <div style={FOOTER}>
                <span style={{ opacity: 0.55 }}>Survival probability:</span>{" "}
                <span style={{
                  color: riskColor,
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: "0.02em",
                }}>{riskScore}%</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <style>{COMMAND_GLASS_KEYFRAMES}</style>
    </>
  )
})

/** Find which row index is currently being typed */
function findTypingRow(rendered: string[], full: string[]): number {
  for (let i = 0; i < rendered.length; i++) {
    if (rendered[i].length < (full[i]?.length ?? 0)) return i
  }
  return rendered.length - 1
}

/* ═══════════════════════════════════════════════════════════════
   STYLE TOKENS — Premium Command Glass
   ═══════════════════════════════════════════════════════════════ */

const GLASS_PANEL: React.CSSProperties = {
  position: "relative",
  background: "linear-gradient(165deg, rgba(8,14,22,0.72) 0%, rgba(6,10,16,0.68) 100%)",
  backdropFilter: "blur(22px) saturate(1.2)",
  WebkitBackdropFilter: "blur(22px) saturate(1.2)",
  border: "1px solid rgba(120,220,255,0.16)",
  borderRadius: 16,
  padding: "22px 24px 18px",
  overflow: "hidden",
  boxShadow:
    "0 1px 0 rgba(255,255,255,0.05) inset, " +
    "0 0 0 1px rgba(0,255,255,0.08), " +
    "0 0 0 3px rgba(4,8,16,0.85), " +
    "0 0 0 4px rgba(0,255,255,0.06), " +
    "0 12px 48px rgba(0,0,0,0.5), " +
    "0 0 24px rgba(0,255,255,0.04)",
}

const SPECULAR_SWEEP: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: "-120%",
  width: "60%",
  height: "100%",
  background: "linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 60%, transparent 100%)",
  animation: "cmdGlassSweep 2.8s ease-in-out 0.4s 1 forwards",
  pointerEvents: "none",
  zIndex: 2,
}

const FILM_GRAIN: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  borderRadius: 14,
  opacity: 0.035,
  backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
  backgroundSize: "128px 128px",
  pointerEvents: "none",
  zIndex: 1,
  mixBlendMode: "overlay",
}

const BEVEL_HIGHLIGHT: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 16,
  right: 16,
  height: 1,
  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 70%, transparent 100%)",
  borderRadius: "14px 14px 0 0",
  pointerEvents: "none",
  zIndex: 3,
}

const REVEAL_GLOW: React.CSSProperties = {
  position: "absolute",
  inset: -1,
  borderRadius: 14,
  border: "1px solid rgba(34,211,238,0.2)",
  boxShadow: "0 0 24px rgba(34,211,238,0.06), 0 0 48px rgba(34,211,238,0.03)",
  animation: "cmdGlassGlow 2.4s ease-in-out infinite",
  pointerEvents: "none",
  zIndex: 0,
}

const HEADER: React.CSSProperties = {
  position: "relative",
  zIndex: 5,
  marginBottom: 16,
  paddingBottom: 13,
  borderBottom: "1px solid rgba(255,255,255,0.07)",
}

const HEADER_TITLE: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "rgba(255,255,255,0.82)",
  fontFamily: "'Inter', system-ui, sans-serif",
}

const HEADER_QUESTION: React.CSSProperties = {
  color: "#22d3ee",
  fontWeight: 500,
  fontStyle: "italic",
  fontSize: 12,
}

const HEADER_SUB: React.CSSProperties = {
  fontSize: 11,
  color: "rgba(255,255,255,0.4)",
  marginTop: 4,
  letterSpacing: "0.05em",
  fontFamily: "'Inter', system-ui, sans-serif",
}

const ROWS_CONTAINER: React.CSSProperties = {
  position: "relative",
  zIndex: 5,
  display: "flex",
  flexDirection: "column",
  gap: 8,
}

const ROW: React.CSSProperties = {}

const CONCERN_ROW: React.CSSProperties = {
  borderLeft: "2px solid rgba(239,68,68,0.5)",
  paddingLeft: 10,
  background: "rgba(239,68,68,0.04)",
  borderRadius: 4,
}

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
  animation: "cmdGlassBlink 0.6s steps(2) infinite",
  marginLeft: 1,
  fontWeight: 300,
}

const FOOTER: React.CSSProperties = {
  position: "relative",
  zIndex: 5,
  marginTop: 14,
  paddingTop: 11,
  borderTop: "1px solid rgba(255,255,255,0.06)",
  fontSize: 11,
  color: "rgba(255,255,255,0.5)",
  letterSpacing: "0.04em",
}

CommandGlassPanel.displayName = "CommandGlassPanel"
export default CommandGlassPanel

/** Keyframe styles — injected once alongside the panel */
export const COMMAND_GLASS_KEYFRAMES = `
@keyframes cmdGlassSweep {
  0%   { left: -120%; }
  100% { left: 120%; }
}
@keyframes cmdGlassGlow {
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 1; }
}
@keyframes cmdGlassBlink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0; }
}
`
