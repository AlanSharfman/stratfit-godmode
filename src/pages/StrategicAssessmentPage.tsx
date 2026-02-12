// src/pages/StrategicAssessmentPage.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Strategic Assessment
// "A structured summary of strengths, vulnerabilities, and where to focus next."
//
// Growth mode (default): Founder-first plain language, 3 sections + watchpoint.
// Advanced mode (toggle): Quantified thresholds, sensitivity ranks, P10/P50/P90.
// Data: Same simulation + engine results used by Compare/Risk/Valuation.
// No engine internals exposed. No finance jargon walls.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import { useSimulationStore } from "@/state/simulationStore";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import { ConfidenceGauge } from "@/components/valuation/ConfidenceGauge";
import { ModelAssumptionsDisclosure } from "@/components/legal/ModelAssumptionsDisclosure";
import { calculateModelConfidence } from "@/logic/confidence/calculateModelConfidence";
import styles from "./StrategicAssessmentPage.module.css";

// ────────────────────────────────────────────────────────────────────────────
// ASSESSMENT SUMMARY BUILDER (pure function)
// Maps existing simulation + engine outputs → structured assessment
// ────────────────────────────────────────────────────────────────────────────

interface AssessmentItem {
  headline: string;
  detail: string;
  // Advanced-mode expansions
  threshold?: string;
  sensitivityRank?: number;
  percentileRef?: string;
}

interface AssessmentSummary {
  strengths: AssessmentItem[];
  vulnerabilities: AssessmentItem[];
  priorities: AssessmentItem[];
  watchpoint: string;
}

function buildAssessmentSummary(
  fullResult: {
    survivalRate: number;
    arrPercentiles: { p10: number; p50: number; p90: number };
    runwayPercentiles: { p10: number; p50: number; p90: number };
    cashPercentiles: { p10: number; p50: number; p90: number };
    sensitivityFactors: Array<{ lever: string; label: string; impact: number; direction: 'positive' | 'negative' }>;
  },
  baselineMonthlyBurn: number,
  baselineStartingCash: number,
): AssessmentSummary {
  const survivalPct = Math.round(fullResult.survivalRate * 100);
  const runwayP10 = fullResult.runwayPercentiles.p10;
  const runwayP50 = fullResult.runwayPercentiles.p50;
  const arrP10 = fullResult.arrPercentiles.p10;
  const arrP50 = fullResult.arrPercentiles.p50;
  const arrP90 = fullResult.arrPercentiles.p90;
  const sens = fullResult.sensitivityFactors;

  // Sort sensitivity by absolute impact
  const sortedSens = [...sens].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  const topPositive = sortedSens.filter(s => s.impact > 0);
  const topNegative = sortedSens.filter(s => s.impact < 0);

  const burnMultiple = baselineMonthlyBurn > 0
    ? baselineStartingCash / (baselineMonthlyBurn * 12)
    : 999;

  const evMultiplier = 3.5;
  const evP50 = (arrP50 / 1_000_000) * evMultiplier;

  // ── STRENGTHS ──
  const strengths: AssessmentItem[] = [];

  if (survivalPct >= 65) {
    strengths.push({
      headline: "Structural survival is strong",
      detail: `Your business survives in ${survivalPct}% of modeled futures. This gives you time to execute.`,
      threshold: `Survival ≥ 65% threshold`,
      sensitivityRank: undefined,
      percentileRef: `P50 runway: ${runwayP50.toFixed(0)} months`,
    });
  }

  if (topPositive[0]) {
    const s = topPositive[0];
    strengths.push({
      headline: `${s.label} is your strongest lever`,
      detail: `Improving this lever has the highest positive impact on your outcomes. It's where investment pays off most.`,
      threshold: `Impact score: ${(Math.abs(s.impact) * 100).toFixed(0)}`,
      sensitivityRank: 1,
      percentileRef: `Direction: ${s.direction}`,
    });
  }

  if (arrP90 / Math.max(1, arrP50) > 1.5) {
    strengths.push({
      headline: "Significant upside optionality exists",
      detail: `In the best-case scenarios, your revenue reaches significantly higher levels. The spread between your median and best case is wide — there's real upside to capture.`,
      threshold: `P90/P50 ratio: ${(arrP90 / Math.max(1, arrP50)).toFixed(1)}x`,
      sensitivityRank: undefined,
      percentileRef: `P90 ARR: $${(arrP90 / 1_000_000).toFixed(1)}M`,
    });
  } else if (burnMultiple > 1.5) {
    strengths.push({
      headline: "Capital efficiency is sound",
      detail: `Your current burn rate relative to cash reserves gives you a comfortable buffer. You're not in a spending emergency.`,
      threshold: `Burn multiple: ${burnMultiple.toFixed(1)}x`,
      sensitivityRank: undefined,
      percentileRef: undefined,
    });
  }

  // Ensure at least 3
  if (strengths.length < 3 && topPositive[1]) {
    const s = topPositive[1];
    strengths.push({
      headline: `${s.label} provides secondary upside`,
      detail: `This is your second-most impactful positive lever. Worth attention after your primary focus area.`,
      threshold: `Impact score: ${(Math.abs(s.impact) * 100).toFixed(0)}`,
      sensitivityRank: 2,
      percentileRef: undefined,
    });
  }
  while (strengths.length < 3) {
    strengths.push({
      headline: "Balanced structural profile",
      detail: "No dominant fragility detected in this dimension. Maintain current trajectory.",
      threshold: undefined,
      sensitivityRank: undefined,
      percentileRef: undefined,
    });
  }

  // ── VULNERABILITIES ──
  const vulnerabilities: AssessmentItem[] = [];

  if (survivalPct < 65) {
    vulnerabilities.push({
      headline: "Survival probability needs attention",
      detail: `In ${100 - survivalPct}% of futures, capital runs out before 36 months. This is the most important thing to address.`,
      threshold: `Survival: ${survivalPct}% (below 65% threshold)`,
      sensitivityRank: undefined,
      percentileRef: `P10 runway: ${runwayP10.toFixed(0)} months`,
    });
  }

  if (topNegative[0]) {
    const s = topNegative[0];
    vulnerabilities.push({
      headline: `${s.label} is your biggest risk factor`,
      detail: `This is the lever that hurts most when it moves against you. Understanding and managing it should be a priority.`,
      threshold: `Negative impact: ${(Math.abs(s.impact) * 100).toFixed(0)}`,
      sensitivityRank: sortedSens.indexOf(s) + 1,
      percentileRef: undefined,
    });
  }

  if (runwayP10 < 12) {
    vulnerabilities.push({
      headline: "Worst-case runway is tight",
      detail: `In a downside scenario, you have less than 12 months of runway. This limits your ability to recover from setbacks.`,
      threshold: `P10 runway: ${runwayP10.toFixed(0)} months (< 12 mo threshold)`,
      sensitivityRank: undefined,
      percentileRef: `P50 runway: ${runwayP50.toFixed(0)} months`,
    });
  } else if ((arrP50 - arrP10) / Math.max(1, arrP50) > 0.4) {
    vulnerabilities.push({
      headline: "Revenue downside is material",
      detail: `The gap between your median and worst-case revenue is wide. A bad quarter could significantly change your trajectory.`,
      threshold: `Downside spread: ${(((arrP50 - arrP10) / Math.max(1, arrP50)) * 100).toFixed(0)}%`,
      sensitivityRank: undefined,
      percentileRef: `P10 ARR: $${(arrP10 / 1_000_000).toFixed(1)}M vs P50: $${(arrP50 / 1_000_000).toFixed(1)}M`,
    });
  }

  if (topNegative[1] && vulnerabilities.length < 3) {
    const s = topNegative[1];
    vulnerabilities.push({
      headline: `${s.label} is a secondary risk`,
      detail: `This compounds your primary risk. Watch it alongside your top vulnerability.`,
      threshold: `Negative impact: ${(Math.abs(s.impact) * 100).toFixed(0)}`,
      sensitivityRank: sortedSens.indexOf(s) + 1,
      percentileRef: undefined,
    });
  }
  while (vulnerabilities.length < 3) {
    vulnerabilities.push({
      headline: "No critical fragility detected here",
      detail: "This dimension is within acceptable bounds. Standard monitoring applies.",
      threshold: undefined,
      sensitivityRank: undefined,
      percentileRef: undefined,
    });
  }

  // ── PRIORITY FOCUS ──
  const priorities: AssessmentItem[] = [];

  // Priority 1: Top positive lever to push
  if (topPositive[0]) {
    const s = topPositive[0];
    priorities.push({
      headline: `Double down on ${s.label}`,
      detail: `This is where effort converts most efficiently into better outcomes. Make it the focus of your next quarter.`,
      threshold: `Impact: +${(Math.abs(s.impact) * 100).toFixed(0)} sensitivity score`,
      sensitivityRank: 1,
      percentileRef: `Estimated EV uplift: +$${(Math.abs(s.impact) * evP50 * 0.25).toFixed(1)}M`,
    });
  }

  // Priority 2: Top negative lever to mitigate
  if (topNegative[0]) {
    const s = topNegative[0];
    priorities.push({
      headline: `Contain ${s.label}`,
      detail: `Reducing exposure here protects your downside. Build contingency or hedge before it moves against you.`,
      threshold: `Risk impact: -${(Math.abs(s.impact) * 100).toFixed(0)} sensitivity score`,
      sensitivityRank: sortedSens.indexOf(s) + 1,
      percentileRef: undefined,
    });
  }

  // Priority 3: Capital / runway action
  if (runwayP10 < 12) {
    priorities.push({
      headline: "Extend your minimum runway to 12+ months",
      detail: "In a downturn, you need at least 12 months to pivot. Cut discretionary spend or start fundraising conversations now.",
      threshold: `Current P10 runway: ${runwayP10.toFixed(0)} months`,
      sensitivityRank: undefined,
      percentileRef: `Cash P10: $${(fullResult.cashPercentiles.p10 / 1_000_000).toFixed(1)}M`,
    });
  } else if (survivalPct < 75) {
    priorities.push({
      headline: "Improve structural resilience",
      detail: "Your survival probability has room to improve. Focus on reducing burn or increasing revenue predictability.",
      threshold: `Target: ≥75% survival`,
      sensitivityRank: undefined,
      percentileRef: `Current: ${survivalPct}%`,
    });
  } else {
    priorities.push({
      headline: "Preserve optionality for expansion",
      detail: "Your fundamentals are sound. Use this stability to invest in growth levers that capture your P90 upside.",
      threshold: `Survival: ${survivalPct}%`,
      sensitivityRank: undefined,
      percentileRef: `P90 EV: $${(evP50 * (arrP90 / Math.max(1, arrP50))).toFixed(1)}M`,
    });
  }

  while (priorities.length < 3) {
    priorities.push({
      headline: "Monitor and maintain current trajectory",
      detail: "No urgent action required. Re-assess after next quarter's data.",
      threshold: undefined,
      sensitivityRank: undefined,
      percentileRef: undefined,
    });
  }

  // ── WATCHPOINT ──
  let watchpoint = "If conditions worsen, ";
  if (topNegative[0] && runwayP10 < 18) {
    watchpoint += `${topNegative[0].label} combined with tight runway (${runwayP10.toFixed(0)} months worst-case) could force premature decisions.`;
  } else if (topNegative[0]) {
    watchpoint += `deterioration in ${topNegative[0].label} is what breaks the model first.`;
  } else {
    watchpoint += `unexpected cost increases or revenue stalls would compress runway below safe thresholds.`;
  }

  return {
    strengths: strengths.slice(0, 3),
    vulnerabilities: vulnerabilities.slice(0, 3),
    priorities: priorities.slice(0, 3),
    watchpoint,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ────────────────────────────────────────────────────────────────────────────

export default function StrategicAssessmentPage() {
  const navigate = useNavigate();
  const { fullResult, assessmentPayload } = useSimulationStore();
  const { baseline: systemBaseline } = useSystemBaseline();
  // ADVANCED is default — no toggle (institutional brief + quantified expansions always visible)
  const advancedMode = true;

  // ── Extract baseline inputs safely (before any conditional return) ──
  const baselineMonthlyBurn = systemBaseline?.financial?.monthlyBurn ?? 400000;
  const baselineStartingCash = systemBaseline?.financial?.cashOnHand ?? 4000000;

  // ── Build assessment from real simulation data (hooks must be unconditional) ──
  const assessmentSource = fullResult ?? assessmentPayload;

  const assessment = useMemo(
    () =>
      assessmentSource
        ? buildAssessmentSummary(assessmentSource, baselineMonthlyBurn, baselineStartingCash)
        : null,
    [assessmentSource, baselineMonthlyBurn, baselineStartingCash],
  );

  // ── Confidence gauge (derived from real model metrics) ──
  const confidenceResult = useMemo(() => {
    if (!assessmentSource) return null;
    const survRate = assessmentSource.survivalRate;
    const arrP = assessmentSource.arrPercentiles;
    const mean = arrP.p50;
    const stdEst = arrP.p90 > arrP.p10 ? (arrP.p90 - arrP.p10) / 3.29 : mean * 0.2;
    return calculateModelConfidence({
      sampleSize: fullResult?.allSimulations?.length ?? 0,
      distributionStdDev: stdEst,
      distributionMean: mean,
      inputCompletenessScore: systemBaseline ? 0.85 : 0.5,
      parameterStabilityScore: survRate > 0.6 ? 0.85 : 0.6,
      methodConsistencyScore: 0.75,
    });
  }, [assessmentSource, fullResult, systemBaseline]);

  // ── Gate: require simulation ──
  if (!assessmentSource || !assessment) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <path
              d="M32 4L8 16V32C8 44 18 54.4 32 60C46 54.4 56 44 56 32V16L32 4Z"
              stroke="rgba(34, 211, 238, 0.3)"
              strokeWidth="1.5"
              fill="rgba(34, 211, 238, 0.04)"
            />
            <path d="M24 32L30 38L40 26" stroke="rgba(34, 211, 238, 0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className={styles.emptyTitle}>Capital Intelligence Unavailable</h2>
        <p className={styles.emptyDescription}>
          Run a simulation first. Capital Intelligence needs real outputs to give you useful insight.
        </p>
        <button
          className={styles.emptyAction}
          onClick={() => navigate('/simulate')}
        >
          Go to Strategy Studio →
        </button>
      </div>
    );
  }

  const survivalPct = Math.round(assessmentSource.survivalRate * 100);
  const runwayP50 = assessmentSource.runwayPercentiles.p50;

  return (
    <div className={styles.root}>
      {/* ── HEADER ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Capital Intelligence</h1>
          <p className={styles.subtitle}>
            A structured summary of strengths, vulnerabilities, and where to focus next.
          </p>
        </div>
        <div className={styles.headerRight}>
          {/* Quick metrics strip */}
          <div className={styles.headerMetrics}>
            <div className={styles.headerMetric}>
              <span className={styles.headerMetricValue}>{survivalPct}%</span>
              <span className={styles.headerMetricLabel}>Survival</span>
            </div>
            <div className={styles.headerMetric}>
              <span className={styles.headerMetricValue}>{runwayP50.toFixed(0)}mo</span>
              <span className={styles.headerMetricLabel}>Runway</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── SECTION 1: STRUCTURAL STRENGTHS ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeader}>
          <span className={styles.sectionDot} data-tone="positive" />
          Structural Strengths
        </h2>
        <p className={styles.sectionSubtitle}>What's working for you right now</p>
        <div className={styles.cardGrid}>
          {assessment.strengths.map((item, i) => (
            <div key={i} className={styles.card} data-tone="positive">
              <h3 className={styles.cardHeadline}>{item.headline}</h3>
              <p className={styles.cardDetail}>{item.detail}</p>
              {advancedMode && (item.threshold || item.sensitivityRank || item.percentileRef) && (
                <div className={styles.advancedExpansion}>
                  {item.threshold && <span className={styles.advancedTag}>{item.threshold}</span>}
                  {item.sensitivityRank && (
                    <span className={styles.advancedTag}>Sensitivity rank #{item.sensitivityRank}</span>
                  )}
                  {item.percentileRef && <span className={styles.advancedTag}>{item.percentileRef}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 2: STRUCTURAL VULNERABILITIES ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeader}>
          <span className={styles.sectionDot} data-tone="risk" />
          Structural Vulnerabilities
        </h2>
        <p className={styles.sectionSubtitle}>Where you're exposed if things shift</p>
        <div className={styles.cardGrid}>
          {assessment.vulnerabilities.map((item, i) => (
            <div key={i} className={styles.card} data-tone="risk">
              <h3 className={styles.cardHeadline}>{item.headline}</h3>
              <p className={styles.cardDetail}>{item.detail}</p>
              {advancedMode && (item.threshold || item.sensitivityRank || item.percentileRef) && (
                <div className={styles.advancedExpansion}>
                  {item.threshold && <span className={styles.advancedTag}>{item.threshold}</span>}
                  {item.sensitivityRank && (
                    <span className={styles.advancedTag}>Sensitivity rank #{item.sensitivityRank}</span>
                  )}
                  {item.percentileRef && <span className={styles.advancedTag}>{item.percentileRef}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 3: PRIORITY FOCUS ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionHeader}>
          <span className={styles.sectionDot} data-tone="action" />
          Priority Focus
        </h2>
        <p className={styles.sectionSubtitle}>Where to direct energy next</p>
        <div className={styles.cardGrid}>
          {assessment.priorities.map((item, i) => (
            <div key={i} className={styles.card} data-tone="action">
              <div className={styles.priorityBadge}>{i + 1}</div>
              <h3 className={styles.cardHeadline}>{item.headline}</h3>
              <p className={styles.cardDetail}>{item.detail}</p>
              {advancedMode && (item.threshold || item.sensitivityRank || item.percentileRef) && (
                <div className={styles.advancedExpansion}>
                  {item.threshold && <span className={styles.advancedTag}>{item.threshold}</span>}
                  {item.sensitivityRank && (
                    <span className={styles.advancedTag}>Sensitivity rank #{item.sensitivityRank}</span>
                  )}
                  {item.percentileRef && <span className={styles.advancedTag}>{item.percentileRef}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── WATCHPOINT CALLOUT ── */}
      <div className={styles.watchpoint}>
        <div className={styles.watchpointIcon}>⚡</div>
        <div className={styles.watchpointContent}>
          <h3 className={styles.watchpointLabel}>Watchpoint</h3>
          <p className={styles.watchpointText}>{assessment.watchpoint}</p>
        </div>
      </div>

      {/* ── CONFIDENCE GAUGE ── */}
      {confidenceResult && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
          <ConfidenceGauge result={confidenceResult} />
        </div>
      )}

      {/* ── LEGAL DISCLOSURE ── */}
      <ModelAssumptionsDisclosure />
    </div>
  );
}
