// src/components/insight/AIInsightPanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — AI Insight Panel (Scenario-aware Intelligence)
//
// Consumes Phase1 scenario simulation results via canonical selectors.
// Renders: Executive Summary · Key Drivers · Risk Assessment · Recommendations
//
// Falls back to BaselineIntelligencePanel behaviour when no active scenario.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useEffect, useMemo, useRef, useState } from "react"
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore"
import { useBaselineStore } from "@/state/baselineStore"
import { selectKpis, selectKpiDeltas } from "@/selectors/kpiSelectors"
import { selectRiskScore } from "@/selectors/riskSelectors"
import { selectDrivers } from "@/selectors/driverSelectors"
import { buildAIInsight } from "@/engine/aiInsightBuilder"
import type { AIInsightOutput } from "@/engine/aiInsightBuilder"
import styles from "./AIInsightPanel.module.css"

/* ── Typewriter hook — types text char-by-char ── */
function useTypewriter(text: string, speed = 22): string {
  const [displayed, setDisplayed] = useState(text)
  const prevRef = useRef(text)

  useEffect(() => {
    if (text === prevRef.current && displayed === text) return
    prevRef.current = text
    let i = 0
    setDisplayed("")
    const id = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])

  return displayed || text
}

function TypewriterText({ text, className }: { text: string; className?: string }) {
  const typed = useTypewriter(text, 22)
  return (
    <div className={className}>
      {typed}
      {typed.length < text.length && <span className={styles.twCursor}>{"\u258E"}</span>}
    </div>
  )
}

/* ── Component ── */

const FALLBACK_MSG = "Submit a decision to generate scenario intelligence."

const AIInsightPanel: React.FC = memo(() => {
  const activeScenarioId = usePhase1ScenarioStore((s) => s.activeScenarioId)
  const scenarios = usePhase1ScenarioStore((s) => s.scenarios)
  const baseline = useBaselineStore((s) => s.baseline)

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

  const ready = insight !== null

  return (
    <aside className={`${styles.wrapper}${ready ? ` ${styles.ambientGlow}` : ""}`}>
      {/* ── Header ── */}
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          AI INTELLIGENCE
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
            <TypewriterText className={styles.summary} text={insight.executiveSummary} />
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
            <TypewriterText className={styles.riskText} text={insight.riskNarrative} />
          </div>

          {/* ── 4. Recommendations ── */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>RECOMMENDATIONS</div>
            <ul className={styles.recList}>
              {insight.recommendations.map((r) => (
                <li key={r.rank} className={styles.recItem}>
                  <div>
                    <span className={styles.recRank}>#{r.rank}</span>
                    {" "}
                    <span className={styles.recAction}>{r.action}</span>
                    <span className={styles.impactBadge} data-level={r.impactLevel}>
                      {r.impactLevel}
                    </span>
                  </div>
                  <div className={styles.recRationale}>{r.rationale}</div>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Footer ── */}
          <div className={styles.footer}>
            <div className={styles.footLine}>
              Risk score:{" "}
              <span className={styles.riskValue} style={{ color: riskColor }}>
                {riskScore}/100
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
