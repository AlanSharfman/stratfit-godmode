// src/components/insight/AIInsightPanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Executive Interpretation Panel (Scenario-aware Intelligence)
//
// Consumes Phase1 scenario simulation results via canonical selectors.
// Renders: Executive Summary · Key Drivers · Risk Assessment · Probability Signals
//
// Cinematic sync: panel content is gated by RevealPhase from cinematicRevealStore.
//   typewriter phase  → char-by-char (24ms/char, rAF-driven, cancellable)
//   signals phase     → 120ms stagger cascade per probability signal
//   reduced motion    → instant text + immediate signals
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore"
import { useBaselineStore } from "@/state/baselineStore"
import { selectKpis, selectKpiDeltas } from "@/selectors/kpiSelectors"
import { selectRiskScore } from "@/selectors/riskSelectors"
import { selectDrivers } from "@/selectors/driverSelectors"
import { buildAIInsight } from "@/engine/aiInsightBuilder"
import type { AIInsightOutput } from "@/engine/aiInsightBuilder"
import {
  useCinematicRevealStore,
  ENABLE_CINEMATIC_SYNC,
  type RevealPhase,
} from "@/state/cinematicRevealStore"
import styles from "./AIInsightPanel.module.css"

/* ── Typewriter hook — rAF-driven, 24ms/char, cancellable ── */
const TYPEWRITER_CHAR_MS = 24

function useTypewriter(
  text: string,
  enabled: boolean,
  onComplete?: () => void,
): string {
  const [displayed, setDisplayed] = useState("")
  const prevTextRef = useRef("")
  const prevEnabledRef = useRef(false)
  const charIndexRef = useRef(0)
  const lastTickRef = useRef(0)
  const rafRef = useRef(0)
  const completedRef = useRef(false)
  // Stable ref for onComplete — avoids re-triggering effect when callback identity changes
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    // If not enabled (reduced motion or pre-typewriter phase), show full text
    if (!enabled) {
      setDisplayed(text)
      prevTextRef.current = text
      completedRef.current = true
      prevEnabledRef.current = false
      return
    }

    // If enabled just turned on, force restart typewriter from 0
    if (!prevEnabledRef.current) {
      prevEnabledRef.current = true
      prevTextRef.current = text
      charIndexRef.current = 0
      completedRef.current = false
      lastTickRef.current = 0
      setDisplayed("")
    }

    // If text changed, restart typewriter
    if (text !== prevTextRef.current) {
      prevTextRef.current = text
      charIndexRef.current = 0
      completedRef.current = false
      lastTickRef.current = 0
      setDisplayed("")
    }

    if (completedRef.current) return

    const tick = (now: number) => {
      if (!lastTickRef.current) lastTickRef.current = now
      const elapsed = now - lastTickRef.current

      if (elapsed >= TYPEWRITER_CHAR_MS) {
        const charsToAdd = Math.min(
          Math.floor(elapsed / TYPEWRITER_CHAR_MS),
          text.length - charIndexRef.current,
        )
        charIndexRef.current += charsToAdd
        lastTickRef.current = now

        setDisplayed(text.slice(0, charIndexRef.current))

        if (charIndexRef.current >= text.length) {
          completedRef.current = true
          onCompleteRef.current?.()
          return
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [text, enabled]) // onComplete excluded — accessed via stable ref

  return displayed || (enabled ? "" : text)
}

function TypewriterText({
  text,
  className,
  enabled,
  onComplete,
}: {
  text: string
  className?: string
  enabled: boolean
  onComplete?: () => void
}) {
  const typed = useTypewriter(text, enabled, onComplete)
  return (
    <div className={className}>
      {typed}
      {enabled && typed.length < text.length && (
        <span className={styles.twCursor}>{"\u258E"}</span>
      )}
    </div>
  )
}

/* ── Signal cascade hook — 120ms stagger ── */
const SIGNAL_STAGGER_MS = 120

function useSignalCascade(count: number, enabled: boolean): number {
  const [visibleCount, setVisibleCount] = useState(0)
  const rafRef = useRef(0)
  const startRef = useRef(0)

  useEffect(() => {
    if (!enabled || count === 0) {
      setVisibleCount(enabled ? 0 : count)
      return
    }

    startRef.current = performance.now()
    setVisibleCount(0)

    const tick = (now: number) => {
      const elapsed = now - startRef.current
      const shown = Math.min(count, Math.floor(elapsed / SIGNAL_STAGGER_MS) + 1)
      setVisibleCount(shown)
      if (shown < count) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [count, enabled])

  return visibleCount
}

/* ── Component ── */

const FALLBACK_MSG = "Submit a decision to generate scenario intelligence."

/** Phase visibility gates */
const PANEL_VISIBLE_PHASES: Set<RevealPhase> = new Set([
  "panel_in", "typewriter", "signals", "blur_out", "restore",
])
const TYPEWRITER_PHASE: RevealPhase = "typewriter"
const SIGNALS_PHASE: RevealPhase = "signals"

/** Probability band label from survival score */
function probabilityBandLabel(score: number): string {
  if (score >= 80) return "HIGH"
  if (score >= 60) return "MODERATE"
  if (score >= 40) return "GUARDED"
  if (score >= 20) return "ELEVATED"
  return "SEVERE"
}

const AIInsightPanel: React.FC = memo(() => {
  const activeScenarioId = usePhase1ScenarioStore((s) => s.activeScenarioId)
  const scenarios = usePhase1ScenarioStore((s) => s.scenarios)
  const baseline = useBaselineStore((s) => s.baseline)

  // Cinematic reveal phase
  const revealPhase = useCinematicRevealStore((s) => s.revealPhase)
  const setPhase = useCinematicRevealStore((s) => s.setPhase)

  // Panel is visible once we pass panel_in (or if cinematic sync disabled)
  const panelVisible = !ENABLE_CINEMATIC_SYNC ||
    PANEL_VISIBLE_PHASES.has(revealPhase) ||
    revealPhase === "idle" // idle = already restored from prior run

  // Typewriter is only active during typewriter phase
  const typewriterActive = ENABLE_CINEMATIC_SYNC && revealPhase === TYPEWRITER_PHASE

  // Signals cascade: actively cascading during signals phase
  const signalsCascading = ENABLE_CINEMATIC_SYNC && revealPhase === SIGNALS_PHASE
  // Signals fully visible: post-cascade, idle (no cinematic), or sync disabled
  const signalsFullyVisible = !ENABLE_CINEMATIC_SYNC ||
    revealPhase === "idle" ||
    revealPhase === "blur_out" ||
    revealPhase === "restore"

  // Callback: when typewriter finishes, advance to signals phase
  const handleTypewriterComplete = useCallback(() => {
    if (revealPhase === TYPEWRITER_PHASE) {
      setPhase("signals")
    }
  }, [revealPhase, setPhase])

  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === activeScenarioId) ?? null,
    [scenarios, activeScenarioId],
  )

  // Build baseline KPIs from baselineStore
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

  // Derive all insight inputs via selectors
  const insight: AIInsightOutput | null = useMemo(() => {
    if (!baselineKpis || !scenarioKpis || !activeScenario?.simulationResults) return null
    if (activeScenario.status !== "complete") return null

    const deltas = selectKpiDeltas(baselineKpis, scenarioKpis)
    if (!deltas) return null

    const riskScore = selectRiskScore(activeScenario.simulationResults.kpis)
    const drivers = selectDrivers(baselineKpis, scenarioKpis, deltas)

    // DEV: proof logs — selector pipeline
    if (import.meta.env.DEV) {
      console.group("[AIInsightPanel] Selector pipeline")
      console.log("BASELINE KPIS", baselineKpis)
      console.log("SCENARIO KPIS", scenarioKpis)
      console.log("DELTA KPIS", deltas)
      console.log("RISK SCORE", riskScore)
      console.log("TOP DRIVERS", drivers)
      console.groupEnd()
    }

    return buildAIInsight({
      decisionQuestion: activeScenario.decision,
      baselineKpis,
      scenarioKpis,
      deltaKpis: deltas,
      riskScore,
      drivers,
    })
  }, [baselineKpis, scenarioKpis, activeScenario])

  const riskScore = useMemo(
    () => selectRiskScore(activeScenario?.simulationResults?.kpis ?? null),
    [activeScenario?.simulationResults?.kpis],
  )

  const riskColor = riskScore >= 78 ? "rgba(52,211,153,0.9)"
    : riskScore >= 60 ? "rgba(251,191,36,0.9)"
    : riskScore >= 45 ? "rgba(251,146,60,0.9)"
    : "rgba(239,68,68,0.9)"

  const ready = insight !== null && panelVisible

  // Signal cascade — only cascades during 'signals' phase; hidden before, full after
  const signalCount = insight?.probabilitySignals.length ?? 0
  const cascadeVisible = useSignalCascade(signalCount, signalsCascading)
  const visibleSignals = signalsCascading ? cascadeVisible
    : signalsFullyVisible ? signalCount
    : 0 // hidden during micro_settle/blur_in/panel_in/typewriter

  return (
    <aside className={`${styles.wrapper}${ready ? ` ${styles.ambientGlow}` : ""}`}>
      {/* ── Header ── */}
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          EXECUTIVE INTERPRETATION
          <span className={styles.strobeDots} aria-hidden="true">
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </span>
        </div>
      </div>

      {!ready ? (
        <div className={styles.section}>
          <div className={styles.fallback}>{FALLBACK_MSG}</div>
        </div>
      ) : (
        <>
          {/* ── 1. Executive Summary ── */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>EXECUTIVE SUMMARY</div>
            <TypewriterText
              className={styles.summary}
              text={insight.executiveSummary}
              enabled={typewriterActive}
              onComplete={handleTypewriterComplete}
            />
          </div>

          {/* ── 2. Key Drivers ── */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>KEY DRIVERS</div>
            <ul className={styles.driverList}>
              {insight.keyDrivers.map((d, i) => (
                <li key={i} className={styles.driverItem}>
                  <span className={styles.driverDot} data-tone={d.tone} />
                  <span className={styles.driverLabel}>{d.label}</span>
                  <span className={styles.driverSep}>{" — "}</span>
                  <span className={styles.driverImpact}>{d.impact}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── 3. Risk Assessment ── */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>RISK ASSESSMENT</div>
            <TypewriterText
              className={styles.riskText}
              text={insight.riskNarrative}
              enabled={typewriterActive}
            />
          </div>

          {/* ── 4. Probability Signals (cascading reveal) ── */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>PROBABILITY SIGNALS</div>
            <ul className={styles.recList}>
              {insight.probabilitySignals.map((s, idx) => (
                <li
                  key={s.rank}
                  className={styles.recItem}
                  style={{
                    opacity: idx < visibleSignals ? 1 : 0,
                    transform: idx < visibleSignals
                      ? "translateY(0)"
                      : "translateY(8px)",
                    transition: "opacity 180ms ease-out, transform 180ms ease-out",
                  }}
                >
                  <div>
                    <span className={styles.recRank}>#{s.rank}</span>
                    {" "}
                    <span className={styles.recAction}>{s.title}</span>
                    <span className={styles.impactBadge} data-level={s.impactLevel}>
                      {s.probability}%
                    </span>
                  </div>
                  <div className={styles.recRationale}>{s.interpretation}</div>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Footer ── */}
          <div className={styles.footer}>
            <div className={styles.footLine}>
              Survival probability:{" "}
              <span className={styles.riskValue} style={{ color: riskColor }}>
                {riskScore}/100
              </span>
              {" "}
              <span className={styles.probabilityBand}>
                {probabilityBandLabel(riskScore)}
              </span>
            </div>
          </div>
        </>
      )}
    </aside>
  )
})

AIInsightPanel.displayName = "AIInsightPanel"
export default AIInsightPanel
