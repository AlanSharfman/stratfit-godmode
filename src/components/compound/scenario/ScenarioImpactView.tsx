// src/components/compound/scenario/ScenarioImpactView.tsx

import React, { memo, useMemo, useState } from "react";
import { ScenarioImpactPanel } from "./ScenarioImpactPanel";
import { useScenarioImpactRows } from "./useScenarioImpactRows";
import { useScenarioStore } from "@/state/scenarioStore";
import { GrowthEfficiencySpider } from "@/components/charts/GrowthEfficiencySpider";
import type { MetricRow } from "./ScenarioImpactPanel";
import styles from "./ScenarioImpactView.module.css";

// ============================================================================
// TYPES
// ============================================================================

interface ScenarioSummary {
  label: string;
  value: string;
  delta?: string;
  tone?: "pos" | "neg" | "neutral";
}

// ============================================================================
// HELPERS (display-only)
// ============================================================================

type ScenarioId = "base" | "upside" | "downside" | "stress" | string;

function scenarioLabelOf(id: ScenarioId): string {
  if (id === "base") return "Base Case";
  if (id === "upside") return "Upside";
  if (id === "downside") return "Downside";
  if (id === "stress") return "Stress";
  return String(id);
}

function whatThisMeansBullets(id: ScenarioId): string[] {
  // Display-only copy. No math changes.
  switch (id) {
    case "upside":
      return [
        "Assumes stronger execution and market conditions than the Base Case.",
        "Use to stress capacity, hiring pace, and cash needs under higher growth.",
        "Primary watch-outs: efficiency drift and cash conversion.",
      ];
    case "downside":
      return [
        "Assumes weaker demand and/or margin pressure vs the Base Case.",
        "Use to identify the minimum operating shape that protects runway.",
        "Primary watch-outs: CAC efficiency and burn discipline.",
      ];
    case "stress":
      return [
        "Stress scenario tests survivability under adverse conditions.",
        "Use to surface immediate runway risks and defensive actions.",
        "Primary watch-outs: cash preservation and execution risk exposure.",
      ];
    case "base":
    default:
      return [
        "Base Case is the current trajectory with current lever settings.",
        "Use this as the benchmark for comparing alternative scenarios.",
      ];
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ScenarioImpactView = memo(function ScenarioImpactView() {
  const [showSpiderDetails, setShowSpiderDetails] = useState(false);

  const rows = useScenarioImpactRows();
  const scenario = useScenarioStore((s) => s.scenario);
  const kpis = useScenarioStore((s) => s.engineResults?.[s.scenario]?.kpis);
  const baseKpis = useScenarioStore((s) => s.engineResults?.base?.kpis);

  const scenarioLabel = scenarioLabelOf(scenario);

  // Separate rows into sections
  const { scenarioMetrics, growthMetrics, riskMetrics } = useMemo(() => {
    const scenarioMetrics: MetricRow[] = [];
    const growthMetrics: MetricRow[] = [];
    const riskMetrics: MetricRow[] = [];

    rows.forEach((row) => {
      // Growth & Efficiency metrics
      if (["cac", "cacPayback", "ltvCac", "safeCac", "grossMargin"].includes(row.id)) {
        growthMetrics.push(row);
      }
      // Risk & Runway metrics
      else if (["runway", "riskScore", "burnRate", "cashBalance"].includes(row.id)) {
        riskMetrics.push(row);
      }
      // Core scenario metrics
      else {
        scenarioMetrics.push(row);
      }
    });

    return { scenarioMetrics, growthMetrics, riskMetrics };
  }, [rows]);

  // Summary cards (display only; uses existing KPI values)
  const summaryCards: ScenarioSummary[] = useMemo(() => {
    const val = (key: string) => kpis?.[key]?.value ?? 0;
    const baseVal = (key: string) => baseKpis?.[key]?.value ?? 0;
    const delta = (key: string) => val(key) - baseVal(key);
    const deltaP = (key: string) =>
      baseVal(key) !== 0 ? ((delta(key) / baseVal(key)) * 100).toFixed(0) : "0";

    const fmtCurrency = (n: number) =>
      n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${(n / 1e3).toFixed(0)}K`;

    return [
      {
        label: "Valuation",
        value: fmtCurrency(val("enterpriseValue")),
        delta: `${delta("enterpriseValue") >= 0 ? "+" : ""}${deltaP("enterpriseValue")}%`,
        tone: delta("enterpriseValue") >= 0 ? "pos" : "neg",
      },
      {
        label: "ARR",
        value: fmtCurrency(val("arrNext12")),
        delta: `${delta("arrNext12") >= 0 ? "+" : ""}${deltaP("arrNext12")}%`,
        tone: delta("arrNext12") >= 0 ? "pos" : "neg",
      },
      {
        label: "Runway",
        value: `${Math.round(val("runway"))} mo`,
        delta: `${delta("runway") >= 0 ? "+" : ""}${Math.round(delta("runway"))} mo`,
        tone: delta("runway") >= 0 ? "pos" : "neg",
      },
      {
        label: "Risk",
        value: `${Math.round(val("riskIndex"))}/100`,
        delta: `${delta("riskIndex") <= 0 ? "" : "+"}${Math.round(delta("riskIndex"))}`,
        tone: delta("riskIndex") <= 0 ? "pos" : "neg",
      },
    ];
  }, [kpis, baseKpis]);

  const meaningBullets = useMemo(() => whatThisMeansBullets(scenario), [scenario]);

  return (
    <div className={styles.container}>
      {/* ============================================================
          SECTION 1: SCENARIO OVERVIEW
          ============================================================ */}
      <section className={styles.overviewSection}>
        <div className={styles.overviewHeader}>
          <div className={styles.titleBlock}>
            <h1 className={styles.pageTitle}>Scenario Deep Dive</h1>
            <div className={styles.scenarioBadge} data-scenario={scenario}>
              {scenarioLabel}
            </div>
          </div>

          <p className={styles.pageSubtitle}>
            Comparing <strong>Base Case</strong> → <strong>{scenarioLabel}</strong>
          </p>
        </div>

        {/* What this means (2–4 bullets) */}
        <div className={styles.meaningPanel}>
          <div className={styles.meaningTitle}>What this means</div>
          <ul className={styles.meaningList}>
            {meaningBullets.slice(0, 4).map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>

        {/* Summary Cards + Spider Chart */}
        <div className={styles.overviewGrid}>
          {/* Left: Summary Cards */}
          <div className={styles.summaryCards}>
            {summaryCards.map((card) => (
              <div key={card.label} className={styles.summaryCard}>
                <div className={styles.cardLabel}>{card.label}</div>
                <div className={styles.cardValue}>{card.value}</div>
                {card.delta && (
                  <div className={`${styles.cardDelta} ${styles[card.tone ?? "neutral"]}`}>
                    {card.delta}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right: Spider Chart module */}
          <div className={styles.spiderWrap}>
            <div className={styles.spiderHeaderRow}>
              <div className={styles.spiderHeaderTitle}>Growth Efficiency Profile</div>
              <button
                type="button"
                className={styles.spiderToggle}
                onClick={() => setShowSpiderDetails((v) => !v)}
              >
                {showSpiderDetails ? "Hide details" : "Show details"}
              </button>
            </div>

            <div className={styles.spiderLegend}>
              <span className={styles.legendItem}>Unit economics</span>
              <span className={styles.legendDot}>•</span>
              <span className={styles.legendItem}>Payback</span>
              <span className={styles.legendDot}>•</span>
              <span className={styles.legendItem}>Margin</span>
              <span className={styles.legendDot}>•</span>
              <span className={styles.legendItem}>Momentum</span>
            </div>

            <GrowthEfficiencySpider />

            {showSpiderDetails ? (
              <div className={styles.spiderDetails}>
                Use this as a shape-check: strong profiles are balanced (not spiky). Large distortions typically mean
                growth is being bought with efficiency, or efficiency is being protected at the expense of momentum.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ============================================================
          DIVIDER
          ============================================================ */}
      <div className={styles.sectionDivider}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerLabel}>Detailed variance analysis</span>
        <span className={styles.dividerLine} />
      </div>

      {/* ============================================================
          SECTION 2: CORE SCENARIO METRICS (Full Width Table)
          ============================================================ */}
      <section className={styles.metricsSection}>
        <ScenarioImpactPanel
          title="Core scenario metrics"
          subtitle="Revenue, Valuation & Financial Position"
          rows={scenarioMetrics}
          rightHint=""
        />
      </section>

      {/* ============================================================
          DIVIDER
          ============================================================ */}
      <div className={styles.sectionDividerSmall}>
        <span className={styles.dividerLineSmall} />
      </div>

      {/* ============================================================
          SECTION 3: GROWTH & EFFICIENCY METRICS
          ============================================================ */}
      <section className={styles.metricsSection}>
        <ScenarioImpactPanel
          title="Growth & efficiency metrics"
          subtitle="Customer Acquisition, LTV/CAC & Unit Economics"
          rows={growthMetrics}
          rightHint=""
        />
      </section>

      {/* ============================================================
          DIVIDER
          ============================================================ */}
      <div className={styles.sectionDividerSmall}>
        <span className={styles.dividerLineSmall} />
      </div>

      {/* ============================================================
          SECTION 4: RISK & RUNWAY METRICS
          ============================================================ */}
      <section className={styles.metricsSection}>
        <ScenarioImpactPanel
          title="Risk & runway metrics"
          subtitle="Burn Rate, Cash Position & Risk Exposure"
          rows={riskMetrics}
          rightHint=""
        />
      </section>

      {/* ============================================================
          AI COMMENTARY FOOTER (display copy only)
          ============================================================ */}
      <section className={styles.aiFooter}>
        <div className={styles.aiHeader}>
          <span className={styles.aiIcon}>🧠</span>
          <span className={styles.aiTitle}>CFO intelligence summary</span>
        </div>
        <p className={styles.aiText}>
          {scenario === "base" ? (
            "Base Case represents current trajectory with no strategic adjustments. Use this as your benchmark for evaluating alternative scenarios."
          ) : scenario === "upside" ? (
            "Upside scenario models optimistic execution with strong market tailwinds. Higher growth trajectory with improved unit economics if key assumptions hold."
          ) : scenario === "downside" ? (
            "Downside scenario assumes challenging market conditions or execution headwinds. Lower growth but maintains operational discipline."
          ) : (
            "Stress scenario models adverse conditions to test survivability. Use this to surface runway constraints and defensive actions early."
          )}
        </p>
      </section>
    </div>
  );
});
