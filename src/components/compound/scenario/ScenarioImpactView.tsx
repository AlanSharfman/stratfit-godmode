import React, { memo, useMemo } from "react";
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
// COMPONENT
// ============================================================================

export const ScenarioImpactView = memo(function ScenarioImpactView() {
  const rows = useScenarioImpactRows();
  const scenario = useScenarioStore((s) => s.scenario);
  const kpis = useScenarioStore((s) => s.engineResults?.[s.scenario]?.kpis);
  const baseKpis = useScenarioStore((s) => s.engineResults?.base?.kpis);

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

  // Summary cards
  const summaryCards: ScenarioSummary[] = useMemo(() => {
    const val = (key: string) => kpis?.[key]?.value ?? 0;
    const baseVal = (key: string) => baseKpis?.[key]?.value ?? 0;
    const delta = (key: string) => val(key) - baseVal(key);
    const deltaP = (key: string) => baseVal(key) !== 0 ? ((delta(key) / baseVal(key)) * 100).toFixed(0) : "0";
    const fmtCurrency = (n: number) => n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${(n / 1e3).toFixed(0)}K`;

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
        label: "Risk Score",
        value: `${Math.round(val("riskIndex"))}/100`,
        delta: `${delta("riskIndex") <= 0 ? "" : "+"}${Math.round(delta("riskIndex"))}`,
        tone: delta("riskIndex") <= 0 ? "pos" : "neg",
      },
    ];
  }, [kpis, baseKpis]);

  const scenarioLabel = scenario === "base" ? "Base Case" :
    scenario === "upside" ? "Upside" :
    scenario === "downside" ? "Downside" :
    scenario === "extreme" ? "Stress Test" : scenario;

  return (
    <div className={styles.container}>
      {/* ============================================================
          SECTION 1: SCENARIO OVERVIEW
          ============================================================ */}
      <section className={styles.overviewSection}>
        <div className={styles.overviewHeader}>
          <div className={styles.titleBlock}>
            <h1 className={styles.pageTitle}>SCENARIO ANALYSIS</h1>
            <div className={styles.scenarioBadge} data-scenario={scenario}>
              {scenarioLabel}
            </div>
          </div>
          <p className={styles.pageSubtitle}>
            Comparing <strong>Base Case</strong> → <strong>{scenarioLabel}</strong>
          </p>
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

          {/* Right: Spider Chart */}
          <div className={styles.spiderWrap}>
            <div className={styles.spiderHeader}>GROWTH EFFICIENCY</div>
            <GrowthEfficiencySpider />
          </div>
        </div>
      </section>

      {/* ============================================================
          DIVIDER
          ============================================================ */}
      <div className={styles.sectionDivider}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerLabel}>DETAILED VARIANCE ANALYSIS</span>
        <span className={styles.dividerLine} />
      </div>

      {/* ============================================================
          SECTION 2: CORE SCENARIO METRICS (Full Width Table)
          ============================================================ */}
      <section className={styles.metricsSection}>
        <ScenarioImpactPanel
          title="CORE SCENARIO METRICS"
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
          title="GROWTH & EFFICIENCY METRICS"
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
          title="RISK & RUNWAY METRICS"
          subtitle="Burn Rate, Cash Position & Risk Exposure"
          rows={riskMetrics}
          rightHint=""
        />
      </section>

      {/* ============================================================
          AI COMMENTARY FOOTER
          ============================================================ */}
      <section className={styles.aiFooter}>
        <div className={styles.aiHeader}>
          <span className={styles.aiIcon}>🧠</span>
          <span className={styles.aiTitle}>CFO INTELLIGENCE SUMMARY</span>
        </div>
        <p className={styles.aiText}>
          {scenario === "base" ? (
            "Base Case represents current trajectory with no strategic adjustments. Use this as your benchmark for evaluating alternative scenarios."
          ) : scenario === "upside" ? (
            "Upside scenario models optimistic execution with strong market tailwinds. Higher growth trajectory with improved unit economics if key assumptions hold. Best-case planning scenario."
          ) : scenario === "downside" ? (
            "Downside scenario assumes challenging market conditions or execution headwinds. Lower growth but maintains operational discipline. Prudent planning for uncertain environments."
          ) : (
            "Stress Test scenario evaluates extreme adverse conditions. Critical for assessing survivability, runway constraints, and defensive restructuring options. Worst-case resilience check."
          )}
        </p>
      </section>
    </div>
  );
});
