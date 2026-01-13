// src/components/compound/variances/VariancesView.tsx
// STRATFIT — CFO-Grade Variance Analysis (Interactive, Engine Truth Only)
// No calculateMetrics, no demo data, no gaming vibe

import React, { useMemo, useState } from "react";
import { useScenarioStore } from "@/state/scenarioStore";
import type { ScenarioId } from "@/state/scenarioStore";
import { getKPIsByCategory, formatKPIValue, type KPIDefinition } from "@/logic/kpiTaxonomy";
import styles from "./VariancesView.module.css";

// ============================================================================
// TYPES
// ============================================================================

type MetricSet = "executive" | "growth" | "efficiency" | "risk";
type ViewMode = "table" | "charts";
type SortMode = "best" | "worst" | "delta";

interface VarianceRow {
  kpi: KPIDefinition;
  base: number;
  upside: number;
  downside: number;
  extreme: number;
  bestValue: number;
  worstValue: number;
  bestScenario: ScenarioId;
  worstScenario: ScenarioId;
  maxDelta: number;
  maxDeltaPct: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SCENARIOS: Array<{ id: ScenarioId; name: string; color: string }> = [
  { id: "base", name: "Base", color: "rgba(120,180,220,0.75)" },
  { id: "upside", name: "Upside", color: "rgba(16,185,129,0.75)" },
  { id: "downside", name: "Downside", color: "rgba(245,158,11,0.75)" },
  { id: "extreme", name: "Stress Test", color: "rgba(239,68,68,0.75)" },
];

// ============================================================================
// DATA UTILITIES
// ============================================================================

function safeNum(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : 0;
}

function buildVarianceRows(
  metricSet: MetricSet,
  engineResults: ReturnType<typeof useScenarioStore>["engineResults"]
): VarianceRow[] {
  const kpis = getKPIsByCategory(metricSet);
  const base = engineResults.base;
  const upside = engineResults.upside;
  const downside = engineResults.downside;
  const extreme = engineResults.extreme;

  if (!base) return [];

  return kpis.map((kpi) => {
    const baseVal = safeNum(base.kpis?.[kpi.key]?.value);
    const upsideVal = safeNum(upside?.kpis?.[kpi.key]?.value ?? baseVal);
    const downsideVal = safeNum(downside?.kpis?.[kpi.key]?.value ?? baseVal);
    const extremeVal = safeNum(extreme?.kpis?.[kpi.key]?.value ?? baseVal);

    const values = [
      { scenario: "base" as ScenarioId, value: baseVal },
      { scenario: "upside" as ScenarioId, value: upsideVal },
      { scenario: "downside" as ScenarioId, value: downsideVal },
      { scenario: "extreme" as ScenarioId, value: extremeVal },
    ];

    const sorted = kpi.higherIsBetter
      ? [...values].sort((a, b) => b.value - a.value)
      : [...values].sort((a, b) => a.value - b.value);

    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    const deltas = [
      Math.abs(upsideVal - baseVal),
      Math.abs(downsideVal - baseVal),
      Math.abs(extremeVal - baseVal),
    ];
    const maxDelta = Math.max(...deltas);
    const maxDeltaPct = baseVal !== 0 ? (maxDelta / Math.abs(baseVal)) * 100 : 0;

    return {
      kpi,
      base: baseVal,
      upside: upsideVal,
      downside: downsideVal,
      extreme: extremeVal,
      bestValue: best.value,
      worstValue: worst.value,
      bestScenario: best.scenario,
      worstScenario: worst.scenario,
      maxDelta,
      maxDeltaPct,
    };
  });
}

function sortRows(rows: VarianceRow[], mode: SortMode): VarianceRow[] {
  const sorted = [...rows];
  if (mode === "best") {
    sorted.sort((a, b) => {
      const aImp = a.kpi.higherIsBetter ? a.bestValue - a.base : a.base - a.bestValue;
      const bImp = b.kpi.higherIsBetter ? b.bestValue - b.base : b.base - b.bestValue;
      return bImp - aImp;
    });
  } else if (mode === "worst") {
    sorted.sort((a, b) => {
      const aImp = a.kpi.higherIsBetter ? a.worstValue - a.base : a.base - a.worstValue;
      const bImp = b.kpi.higherIsBetter ? b.worstValue - b.base : b.base - b.worstValue;
      return aImp - bImp;
    });
  } else {
    sorted.sort((a, b) => b.maxDeltaPct - a.maxDeltaPct);
  }
  return sorted;
}

function generateRecommendation(
  engineResults: ReturnType<typeof useScenarioStore>["engineResults"]
): { scenario: ScenarioId; reason: string } {
  // Weighted scoring: ARR growth (30%), runway (25%), risk (25%), valuation (20%)
  const scores: Array<{ id: ScenarioId; score: number }> = [];

  SCENARIOS.forEach((s) => {
    if (s.id === "base") return;
    const result = engineResults[s.id];
    if (!result) return;

    const arrGrowth = safeNum(result.kpis?.arrGrowthPct?.value);
    const runway = safeNum(result.kpis?.runway?.value);
    const risk = safeNum(result.kpis?.riskIndex?.value);
    const valuation = safeNum(result.kpis?.enterpriseValue?.value);

    // Normalize and weight
    const arrScore = Math.min(100, Math.max(0, arrGrowth * 2)) * 0.3;
    const runwayScore = Math.min(100, (runway / 36) * 100) * 0.25;
    const riskScore = Math.min(100, 100 - risk) * 0.25;
    const valScore = Math.min(100, (valuation / 100) * 100) * 0.2;

    scores.push({
      id: s.id,
      score: arrScore + runwayScore + riskScore + valScore,
    });
  });

  scores.sort((a, b) => b.score - a.score);
  const winner = scores[0];

  const reasons: Record<ScenarioId, string> = {
    base: "Baseline scenario",
    upside: "Strongest balance of growth, runway, and valuation uplift",
    downside: "Most resilient under conservative assumptions",
    extreme: "Stress-tested for survivability under severe conditions",
  };

  return {
    scenario: winner?.id ?? "upside",
    reason: reasons[winner?.id] ?? "Balanced risk-adjusted return",
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function VariancesView() {
  const engineResults = useScenarioStore((s) => s.engineResults);

  const [metricSet, setMetricSet] = useState<MetricSet>("executive");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [sortMode, setSortMode] = useState<SortMode>("delta");
  const [pinnedScenario, setPinnedScenario] = useState<ScenarioId | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const rows = useMemo(
    () => sortRows(buildVarianceRows(metricSet, engineResults), sortMode),
    [metricSet, engineResults, sortMode]
  );

  const recommendation = useMemo(() => generateRecommendation(engineResults), [engineResults]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Scenario Variances</h2>
          <p className={styles.subtitle}>Cross-scenario KPI comparison hub</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className={styles.controlBar}>
        {/* Metric Set */}
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Metric Set:</label>
          <div className={styles.segmentedControl}>
            {(["executive", "growth", "efficiency", "risk"] as MetricSet[]).map((m) => (
              <button
                key={m}
                className={`${styles.segment} ${metricSet === m ? styles.active : ""}`}
                onClick={() => setMetricSet(m)}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode */}
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>View:</label>
          <div className={styles.segmentedControl}>
            <button
              className={`${styles.segment} ${viewMode === "table" ? styles.active : ""}`}
              onClick={() => setViewMode("table")}
            >
              Table
            </button>
            <button
              className={`${styles.segment} ${viewMode === "charts" ? styles.active : ""}`}
              onClick={() => setViewMode("charts")}
            >
              Charts
            </button>
          </div>
        </div>

        {/* Sort */}
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Sort:</label>
          <select
            className={styles.dropdown}
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
          >
            <option value="delta">Largest Δ</option>
            <option value="best">Best vs Base</option>
            <option value="worst">Worst vs Base</option>
          </select>
        </div>

        {/* Pin Scenario */}
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Pin:</label>
          <div className={styles.scenarioPins}>
            {SCENARIOS.filter((s) => s.id !== "base").map((s) => (
              <button
                key={s.id}
                className={`${styles.pin} ${pinnedScenario === s.id ? styles.pinActive : ""}`}
                onClick={() => setPinnedScenario(pinnedScenario === s.id ? null : s.id)}
                style={{
                  borderColor: pinnedScenario === s.id ? s.color : "transparent",
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Recommendation Card */}
      <div className={styles.aiCard}>
        <div className={styles.aiHeader}>
          <span className={styles.aiIcon}>🧠</span>
          <span className={styles.aiTitle}>AI Strategic Analysis</span>
        </div>
        <ul className={styles.aiBullets}>
          <li>Comparing {rows.length} metrics across 4 scenarios</li>
          <li>
            <strong>Recommended: </strong>
            {SCENARIOS.find((s) => s.id === recommendation.scenario)?.name ?? "Upside"}
          </li>
          <li>{recommendation.reason}</li>
        </ul>
      </div>

      {/* Table */}
      {viewMode === "table" && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thMetric}>Metric</th>
                <th className={styles.thScenario}>Base</th>
                <th className={styles.thScenario}>Upside</th>
                <th className={styles.thScenario}>Downside</th>
                <th className={styles.thScenario}>Stress</th>
                <th className={styles.thDelta}>Max Δ%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isExpanded = expandedRow === row.kpi.key;
                return (
                  <React.Fragment key={row.kpi.key}>
                    <tr
                      className={`${styles.row} ${isExpanded ? styles.rowExpanded : ""}`}
                      onClick={() => setExpandedRow(isExpanded ? null : row.kpi.key)}
                    >
                      <td className={styles.tdMetric}>{row.kpi.label}</td>
                      <td className={styles.tdValue}>{formatKPIValue(row.kpi.key, row.base)}</td>
                      <td
                        className={`${styles.tdValue} ${
                          pinnedScenario === "upside" ? styles.pinned : ""
                        }`}
                      >
                        {formatKPIValue(row.kpi.key, row.upside)}
                      </td>
                      <td
                        className={`${styles.tdValue} ${
                          pinnedScenario === "downside" ? styles.pinned : ""
                        }`}
                      >
                        {formatKPIValue(row.kpi.key, row.downside)}
                      </td>
                      <td
                        className={`${styles.tdValue} ${
                          pinnedScenario === "extreme" ? styles.pinned : ""
                        }`}
                      >
                        {formatKPIValue(row.kpi.key, row.extreme)}
                      </td>
                      <td className={styles.tdDelta}>
                        {row.maxDeltaPct.toFixed(0)}%
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className={styles.drilldown}>
                        <td colSpan={6}>
                          <div className={styles.drilldownContent}>
                            <div className={styles.miniChart}>
                              {SCENARIOS.map((s) => {
                                const val = row[s.id] as number;
                                const pct = row.base !== 0 ? (val / row.base) * 100 : 100;
                                return (
                                  <div key={s.id} className={styles.bar}>
                                    <span className={styles.barLabel}>{s.name}</span>
                                    <div
                                      className={styles.barFill}
                                      style={{
                                        width: `${Math.min(100, pct)}%`,
                                        background: s.color,
                                      }}
                                    />
                                    <span className={styles.barValue}>
                                      {formatKPIValue(row.kpi.key, val)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                            <div className={styles.cfoNote}>
                              <strong>CFO Note:</strong> {row.kpi.label} ranges from{" "}
                              {formatKPIValue(row.kpi.key, row.worstValue)} to{" "}
                              {formatKPIValue(row.kpi.key, row.bestValue)}. Best performer:{" "}
                              {SCENARIOS.find((s) => s.id === row.bestScenario)?.name}.
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Charts View */}
      {viewMode === "charts" && (
        <div className={styles.chartsGrid}>
          {rows.slice(0, 6).map((row) => (
            <div key={row.kpi.key} className={styles.chartCard}>
              <div className={styles.chartTitle}>{row.kpi.label}</div>
              <div className={styles.chartBars}>
                {SCENARIOS.map((s) => {
                  const val = row[s.id] as number;
                  const maxVal = Math.max(row.base, row.upside, row.downside, row.extreme);
                  const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                  return (
                    <div key={s.id} className={styles.chartBar}>
                      <span className={styles.chartBarLabel}>{s.name}</span>
                      <div
                        className={styles.chartBarFill}
                        style={{ width: `${pct}%`, background: s.color }}
                      />
                      <span className={styles.chartBarValue}>
                        {formatKPIValue(row.kpi.key, val)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

