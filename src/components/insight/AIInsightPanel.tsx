// src/components/insight/AIInsightPanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Executive Interpretation Panel (Scenario-aware Intelligence)
//
// Consumes Phase1 scenario simulation results via canonical selectors.
// Renders: Executive Summary · Key Drivers · Risk Assessment · Probability Signals
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useMemo } from "react"
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore"
import { useBaselineStore } from "@/state/baselineStore"
import { selectKpis, selectKpiDeltas } from "@/selectors/kpiSelectors"
import { selectRiskScore } from "@/selectors/riskSelectors"
import { selectDrivers } from "@/selectors/driverSelectors"
import { buildAIInsight } from "@/engine/aiInsightBuilder"
import type { AIInsightOutput } from "@/engine/aiInsightBuilder"
import styles from "./AIInsightPanel.module.css"

/* ── Component ── */

const FALLBACK_MSG = "Submit a decision to generate scenario intelligence."

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
    <aside
      className={`${styles.wrapper}${ready ? ` ${styles.ambientGlow}` : ""}`}
    >
      {/* ── Decision-anchored header ── */}
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          {activeScenario?.decision
            ? <>Decision Insight &mdash; <span style={{ color: "#22d3ee", fontWeight: 400, fontStyle: "italic" }}>{activeScenario.decision}</span></>
            : "Scenario Insight"
          }
          <span className={styles.strobeDots} aria-hidden="true">
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </span>
        </div>
        {activeScenario?.decisionIntentLabel && (
          <div style={{
            fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4,
            letterSpacing: "0.04em",
          }}>
            Based on <span style={{ color: "rgba(34,211,238,0.6)" }}>{activeScenario.decisionIntentLabel}</span> scenario outcomes
          </div>
        )}
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
            <div className={styles.summary}>{insight!.executiveSummary}</div>
          </div>

          {/* ── 2. Key Drivers ── */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>KEY DRIVERS</div>
            <ul className={styles.driverList}>
              {insight!.keyDrivers.map((d, i) => (
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
            <div className={styles.riskText}>{insight!.riskNarrative}</div>
          </div>

          {/* ── 4. Probability Signals ── */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>PROBABILITY SIGNALS</div>
            <ul className={styles.recList}>
              {insight!.probabilitySignals.map((s) => (
                <li key={s.rank} className={styles.recItem}>
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
