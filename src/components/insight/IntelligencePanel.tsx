// src/components/insight/IntelligencePanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Intelligence Panel (Expanded Right Rail)
//
// Renders all intelligence sections instantly (no typewriter).
// Consumes AIInsightOutput from the canonical buildAIInsight() pipeline.
// Reads from phase1ScenarioStore + baselineStore via selectors.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useMemo } from "react"
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore"
import { useBaselineStore } from "@/state/baselineStore"
import { selectKpis, selectKpiDeltas } from "@/selectors/kpiSelectors"
import { selectRiskScore } from "@/selectors/riskSelectors"
import { selectDrivers } from "@/selectors/driverSelectors"
import { buildAIInsight } from "@/engine/aiInsightBuilder"
import type { AIInsightOutput } from "@/engine/aiInsightBuilder"
import styles from "./IntelligencePanel.module.css"

/* ── Props ── */
interface IntelligencePanelProps {
  onCollapse: () => void
}

/* ── Helpers ── */

function survivalColor(score: number): string {
  if (score >= 76) return "#4ADE80"
  if (score >= 56) return "#86EFAC"
  if (score >= 36) return "#FBBF24"
  return "#F87171"
}

function survivalBandLabel(score: number): string {
  if (score >= 80) return "HIGH"
  if (score >= 60) return "MODERATE"
  if (score >= 40) return "GUARDED"
  if (score >= 20) return "ELEVATED"
  return "SEVERE"
}

function driverSymbol(tone: "positive" | "negative" | "neutral"): { char: string; className: string } {
  switch (tone) {
    case "positive": return { char: "▲", className: styles.driverArrowPositive }
    case "negative": return { char: "▼", className: styles.driverArrowNegative }
    default:         return { char: "◆", className: styles.driverArrowNeutral }
  }
}

/* ── Component ── */

const IntelligencePanel: React.FC<IntelligencePanelProps> = memo(({ onCollapse }) => {
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

  // Build scenario KPIs
  const scenarioKpis = useMemo(
    () => selectKpis(activeScenario?.simulationResults?.kpis ?? null),
    [activeScenario?.simulationResults?.kpis],
  )

  // Build insight output
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

  // Risk score for survival probability
  const riskScore = useMemo(
    () => selectRiskScore(activeScenario?.simulationResults?.kpis ?? null),
    [activeScenario?.simulationResults?.kpis],
  )

  const topSignal = insight?.probabilitySignals?.[0] ?? null
  const isCritical = riskScore < 45
  const color = survivalColor(riskScore)

  return (
    <div className={styles.wrapper}>
      {/* 1. Header Row */}
      <div className={styles.headerRow}>
        <span className={styles.headerTitle}>Decision Insight</span>
        <button
          type="button"
          className={styles.collapseBtn}
          onClick={onCollapse}
          aria-label="Collapse intelligence panel"
          title="Collapse (I)"
        >
          ✕
        </button>
      </div>

      {/* Scenario name */}
      {activeScenario?.decision && (
        <div className={styles.scenarioName}>{activeScenario.decision}</div>
      )}

      {!insight ? (
        <div className={styles.fallback}>
          Submit a decision to generate scenario intelligence.
        </div>
      ) : (
        <>
          {/* 2. Executive Summary */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Executive Summary</div>
            <div className={styles.sectionBody}>{insight.executiveSummary}</div>
          </div>

          {/* 3. Key Drivers */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Key Drivers</div>
            <ul className={styles.driverList}>
              {insight.keyDrivers.map((d, i) => {
                const sym = driverSymbol(d.tone)
                return (
                  <li key={i} className={styles.driverItem}>
                    <span className={`${styles.driverArrow} ${sym.className}`}>{sym.char}</span>
                    <span className={styles.driverText}>
                      {d.label} — {d.impact}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* 4. Risk Assessment */}
          <div className={`${styles.section}${isCritical ? ` ${styles.riskCritical}` : ""}`}>
            <div className={styles.sectionTitle}>Risk Assessment</div>
            <div className={`${styles.riskBody}${isCritical ? ` ${styles.riskBorderCritical}` : ""}`}>
              {insight.riskNarrative}
            </div>
          </div>

          {/* 5. Top Signal */}
          {topSignal && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Top Signal</div>
              <div className={styles.signalHeader}>
                #{topSignal.rank} {topSignal.title}
                <span className={styles.signalProbability}>— {topSignal.probability}%</span>
              </div>
              <div className={styles.signalInterpretation}>{topSignal.interpretation}</div>
            </div>
          )}

          {/* 6. Survival Probability */}
          <div className={styles.survivalSection}>
            <div className={styles.survivalNumber} style={{ color }}>
              {riskScore}<span style={{ fontSize: 20, fontWeight: 400, color: "rgba(182,228,255,0.4)" }}>/100</span>
            </div>
            <div className={styles.survivalLabel}>Survival Probability</div>
            <div className={styles.survivalBand} style={{ color }}>
              {survivalBandLabel(riskScore)}
            </div>
          </div>

          {/* 7. Action Buttons */}
          <div className={styles.actions}>
            <button type="button" className={styles.actionBtn} disabled>
              Compare Scenarios
            </button>
            <button type="button" className={styles.actionBtn} disabled>
              Export Report
            </button>
          </div>
        </>
      )}
    </div>
  )
})

IntelligencePanel.displayName = "IntelligencePanel"
export default IntelligencePanel
