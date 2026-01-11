// src/components/compound/variances/VariancesView.tsx
// STRATFIT — Scenario Variances Comparison View
// Compares all scenario types by KPI with delta variances and AI commentary

import { useMemo, memo } from "react";
import { useScenarioStore } from "@/state/scenarioStore";
import { calculateMetrics } from "@/logic/calculateMetrics";
import type { ScenarioId } from "@/components/ScenarioSlidePanel";
import styles from "./VariancesView.module.css";

// ============================================================================
// TYPES
// ============================================================================

interface ScenarioKpis {
  id: ScenarioId;
  name: string;
  color: string;
  arr: number;
  arrGrowth: number;
  runway: number;
  burn: number;
  cac: number;
  ltvCac: number;
  cacPayback: number;
  riskIndex: number;
  valuation: number;
  cashPosition: number;
  momentum: number;
}

interface VarianceRow {
  metric: string;
  unit: string;
  base: number;
  conservative: number;
  growth: number;
  turnaround: number;
  bestScenario: ScenarioId;
  worstScenario: ScenarioId;
  maxDelta: number;
  direction: "higherIsBetter" | "lowerIsBetter";
  insight: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SCENARIOS: Array<{ id: ScenarioId; name: string; color: string }> = [
  { id: "base", name: "Base Case", color: "#22d3ee" },
  { id: "conservative", name: "Conservative", color: "#60a5fa" },
  { id: "growth", name: "Growth", color: "#34d399" },
  { id: "turnaround", name: "Turnaround", color: "#f472b6" },
];

const SCENARIO_COLORS: Record<ScenarioId, string> = {
  base: "#22d3ee",
  conservative: "#60a5fa",
  growth: "#34d399",
  turnaround: "#f472b6",
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatValue(value: number, unit: string): string {
  if (unit === "$M") return `$${(value / 1_000_000).toFixed(1)}M`;
  if (unit === "$K") return `$${(value / 1_000).toFixed(0)}K`;
  if (unit === "$") return `$${value.toLocaleString()}`;
  if (unit === "x") return `${value.toFixed(1)}x`;
  if (unit === "mo") return `${Math.round(value)} mo`;
  if (unit === "%") return `${value.toFixed(1)}%`;
  if (unit === "/100") return `${Math.round(value)}/100`;
  return value.toFixed(1);
}

function formatDelta(value: number, unit: string): string {
  const sign = value >= 0 ? "+" : "";
  if (unit === "$M") return `${sign}$${(value / 1_000_000).toFixed(1)}M`;
  if (unit === "$K") return `${sign}$${(value / 1_000).toFixed(0)}K`;
  if (unit === "$") return `${sign}$${value.toLocaleString()}`;
  if (unit === "x") return `${sign}${value.toFixed(2)}x`;
  if (unit === "mo") return `${sign}${Math.round(value)} mo`;
  if (unit === "%") return `${sign}${value.toFixed(1)}%`;
  if (unit === "/100") return `${sign}${Math.round(value)}`;
  return `${sign}${value.toFixed(1)}`;
}

function generateInsight(row: VarianceRow, scenarios: ScenarioKpis[]): string {
  const bestName = SCENARIOS.find(s => s.id === row.bestScenario)?.name ?? row.bestScenario;
  const worstName = SCENARIOS.find(s => s.id === row.worstScenario)?.name ?? row.worstScenario;
  const deltaPercent = row.base !== 0 
    ? Math.abs((row.maxDelta / row.base) * 100).toFixed(0)
    : "∞";

  // Generate contextual insights based on metric
  switch (row.metric) {
    case "ARR (12mo)":
      if (row.maxDelta > 500_000) {
        return `${bestName} projects ${deltaPercent}% higher ARR. Growth trajectory significantly impacts revenue ceiling.`;
      }
      return `ARR variance of ${formatDelta(row.maxDelta, row.unit)} between scenarios. Revenue path highly sensitive to growth levers.`;
    
    case "ARR Growth":
      return `Growth rates span from ${formatValue(Math.min(row.conservative, row.growth, row.turnaround), "%")} to ${formatValue(Math.max(row.conservative, row.growth, row.turnaround), "%")}. ${bestName} offers strongest expansion trajectory.`;
    
    case "Runway":
      if (row.maxDelta > 6) {
        return `⚠️ ${worstName} shows ${Math.abs(row.maxDelta).toFixed(0)} months shorter runway. Cash management critical.`;
      }
      return `Runway varies by ${Math.abs(row.maxDelta).toFixed(0)} months. ${bestName} provides longest operating buffer.`;
    
    case "Burn Rate":
      return `Monthly burn ranges ${formatDelta(-row.maxDelta, "$K")} between scenarios. ${row.direction === "lowerIsBetter" ? bestName : worstName} is most capital efficient.`;
    
    case "CAC":
      if (row.maxDelta > 5000) {
        return `Customer acquisition costs vary by ${formatDelta(row.maxDelta, "$")}. ${bestName} achieves most efficient customer acquisition.`;
      }
      return `CAC relatively stable across scenarios. Acquisition efficiency maintained.`;
    
    case "LTV/CAC":
      if (row.maxDelta > 1) {
        return `Unit economics range from ${formatValue(Math.min(row.conservative, row.growth, row.turnaround), "x")} to ${formatValue(Math.max(row.conservative, row.growth, row.turnaround), "x")}. ${bestName} shows strongest ROI per customer.`;
      }
      return `LTV/CAC ratio stable. Core unit economics hold across scenarios.`;
    
    case "CAC Payback":
      return `Payback period varies by ${Math.abs(row.maxDelta).toFixed(0)} months. ${bestName} recovers acquisition costs fastest.`;
    
    case "Risk Index":
      if (row.maxDelta > 15) {
        return `⚠️ Risk variance of ${Math.abs(row.maxDelta).toFixed(0)} points. ${worstName} carries significantly elevated risk profile.`;
      }
      return `Risk profiles range ${Math.abs(row.maxDelta).toFixed(0)} points. All scenarios within acceptable tolerance.`;
    
    case "Valuation":
      return `Enterprise value delta of ${formatDelta(row.maxDelta, "$M")}. ${bestName} maximizes stakeholder value.`;
    
    case "Cash Position":
      return `Cash reserves vary by ${formatDelta(Math.abs(row.maxDelta), "$M")}. Liquidity management impacts flexibility.`;
    
    case "Momentum":
      return `Momentum scores range ${Math.abs(row.maxDelta).toFixed(0)} points. ${bestName} shows strongest forward indicators.`;
    
    default:
      return `${bestName} outperforms by ${deltaPercent}% on this metric.`;
  }
}

// ============================================================================
// HOOKS
// ============================================================================

function useVariancesData(currentLevers: Record<string, number>): {
  scenarios: ScenarioKpis[];
  rows: VarianceRow[];
  summary: { bestOverall: ScenarioId; worstOverall: ScenarioId; totalInsight: string };
} {
  return useMemo(() => {
    // Calculate KPIs for each scenario
    const scenarios: ScenarioKpis[] = SCENARIOS.map(({ id, name, color }) => {
      const metrics = calculateMetrics(currentLevers, id);
      
      // Compute derived metrics
      const burn = metrics.burnQuality * 1000;
      const marketingSpend = burn * 0.45;
      const avgRevenuePerCustomer = 12_000;
      const grossMargin = 0.74;
      const annualChurn = 0.12;
      
      const arrCurrent = (metrics.momentum / 10) * 1_000_000;
      const growthRate = Math.max(-0.5, Math.min(0.8, (metrics.momentum - 50) * 0.006));
      const arrNext12 = arrCurrent * (1 + growthRate);
      const arrDelta = arrNext12 - arrCurrent;
      const newCustomers = Math.max(1, arrDelta / avgRevenuePerCustomer);
      
      const cac = marketingSpend / newCustomers;
      const ltv = (avgRevenuePerCustomer * grossMargin) / annualChurn;
      const ltvCac = ltv / cac;
      const cacPayback = (cac / (avgRevenuePerCustomer * grossMargin)) * 12;

      return {
        id,
        name,
        color,
        arr: arrNext12,
        arrGrowth: growthRate * 100,
        runway: metrics.runway,
        burn,
        cac,
        ltvCac,
        cacPayback,
        riskIndex: metrics.riskIndex,
        valuation: (metrics.enterpriseValue / 10) * 1_000_000,
        cashPosition: metrics.cashPosition * 1_000_000,
        momentum: metrics.momentum,
      };
    });

    // Define metrics to compare
    const metricsConfig: Array<{
      key: keyof ScenarioKpis;
      label: string;
      unit: string;
      direction: "higherIsBetter" | "lowerIsBetter";
    }> = [
      { key: "arr", label: "ARR (12mo)", unit: "$M", direction: "higherIsBetter" },
      { key: "arrGrowth", label: "ARR Growth", unit: "%", direction: "higherIsBetter" },
      { key: "runway", label: "Runway", unit: "mo", direction: "higherIsBetter" },
      { key: "burn", label: "Burn Rate", unit: "$K", direction: "lowerIsBetter" },
      { key: "cac", label: "CAC", unit: "$", direction: "lowerIsBetter" },
      { key: "ltvCac", label: "LTV/CAC", unit: "x", direction: "higherIsBetter" },
      { key: "cacPayback", label: "CAC Payback", unit: "mo", direction: "lowerIsBetter" },
      { key: "riskIndex", label: "Risk Index", unit: "/100", direction: "lowerIsBetter" },
      { key: "valuation", label: "Valuation", unit: "$M", direction: "higherIsBetter" },
      { key: "cashPosition", label: "Cash Position", unit: "$M", direction: "higherIsBetter" },
      { key: "momentum", label: "Momentum", unit: "/100", direction: "higherIsBetter" },
    ];

    // Build variance rows
    const rows: VarianceRow[] = metricsConfig.map(({ key, label, unit, direction }) => {
      const values = scenarios.map(s => ({ id: s.id, value: s[key] as number }));
      const sorted = [...values].sort((a, b) => 
        direction === "higherIsBetter" ? b.value - a.value : a.value - b.value
      );
      
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      const maxDelta = best.value - worst.value;

      const row: VarianceRow = {
        metric: label,
        unit,
        base: scenarios.find(s => s.id === "base")![key] as number,
        conservative: scenarios.find(s => s.id === "conservative")![key] as number,
        growth: scenarios.find(s => s.id === "growth")![key] as number,
        turnaround: scenarios.find(s => s.id === "turnaround")![key] as number,
        bestScenario: best.id,
        worstScenario: worst.id,
        maxDelta,
        direction,
        insight: "",
      };

      row.insight = generateInsight(row, scenarios);
      return row;
    });

    // Calculate overall best/worst scenario
    const scenarioScores: Record<ScenarioId, number> = {
      base: 0,
      conservative: 0,
      growth: 0,
      turnaround: 0,
    };

    rows.forEach(row => {
      scenarioScores[row.bestScenario] += 2;
      scenarioScores[row.worstScenario] -= 1;
    });

    const sortedScenarios = (Object.entries(scenarioScores) as [ScenarioId, number][])
      .sort((a, b) => b[1] - a[1]);
    
    const bestOverall = sortedScenarios[0][0];
    const worstOverall = sortedScenarios[sortedScenarios.length - 1][0];

    const bestName = SCENARIOS.find(s => s.id === bestOverall)?.name ?? bestOverall;
    const worstName = SCENARIOS.find(s => s.id === worstOverall)?.name ?? worstOverall;

    const totalInsight = `Based on comprehensive variance analysis, **${bestName}** demonstrates superior performance across the majority of KPIs, particularly in growth efficiency and risk-adjusted returns. **${worstName}** shows elevated risk factors that warrant careful consideration. The delta between scenarios suggests significant strategic optionality—lever adjustments can meaningfully shift outcomes.`;

    return { scenarios, rows, summary: { bestOverall, worstOverall, totalInsight } };
  }, [currentLevers]);
}

// ============================================================================
// COMPONENT
// ============================================================================

function VariancesView() {
  const currentLevers = useScenarioStore((s) => s.currentLevers);
  const scenario = useScenarioStore((s) => s.scenario);
  
  const { scenarios, rows, summary } = useVariancesData(currentLevers ?? {
    demandStrength: 60,
    pricingPower: 50,
    expansionVelocity: 45,
    costDiscipline: 55,
    hiringIntensity: 40,
    operatingDrag: 35,
    marketVolatility: 30,
    executionRisk: 25,
    fundingPressure: 20,
  });

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Scenario Variances</h2>
          <span className={styles.subtitle}>Cross-Scenario KPI Comparison & Delta Analysis</span>
        </div>
        <div className={styles.legend}>
          {SCENARIOS.map(s => (
            <div key={s.id} className={styles.legendItem}>
              <span 
                className={styles.legendDot} 
                style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }} 
              />
              <span className={[styles.legendLabel, s.id === scenario ? styles.active : ""].join(" ")}>
                {s.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Summary */}
      <div className={styles.aiSummary}>
        <div className={styles.aiHeader}>
          <span className={styles.aiIcon}>🧠</span>
          <span className={styles.aiTitle}>AI Strategic Analysis</span>
        </div>
        <p className={styles.aiText}>{summary.totalInsight}</p>
        <div className={styles.aiRecommendation}>
          <span className={styles.recBadge} style={{ background: SCENARIO_COLORS[summary.bestOverall] }}>
            Recommended: {SCENARIOS.find(s => s.id === summary.bestOverall)?.name}
          </span>
        </div>
      </div>

      {/* Variance Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.metricHeader}>Metric</th>
              {SCENARIOS.map(s => (
                <th 
                  key={s.id} 
                  className={styles.scenarioHeader}
                  style={{ borderBottomColor: s.color }}
                >
                  <span style={{ color: s.color }}>{s.name}</span>
                </th>
              ))}
              <th className={styles.deltaHeader}>Max Δ</th>
              <th className={styles.insightHeader}>AI Insight</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.metric} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                <td className={styles.metricCell}>
                  <span className={styles.metricName}>{row.metric}</span>
                </td>
                {(["base", "conservative", "growth", "turnaround"] as ScenarioId[]).map(sid => {
                  const value = row[sid as keyof VarianceRow] as number;
                  const isBest = sid === row.bestScenario;
                  const isWorst = sid === row.worstScenario;
                  const isActive = sid === scenario;
                  
                  return (
                    <td 
                      key={sid} 
                      className={[
                        styles.valueCell,
                        isBest ? styles.best : "",
                        isWorst ? styles.worst : "",
                        isActive ? styles.activeCurrent : "",
                      ].filter(Boolean).join(" ")}
                    >
                      <span className={styles.value}>{formatValue(value, row.unit)}</span>
                      {isBest && <span className={styles.bestBadge}>Best</span>}
                      {isWorst && <span className={styles.worstBadge}>Worst</span>}
                    </td>
                  );
                })}
                <td className={styles.deltaCell}>
                  <span 
                    className={styles.deltaValue}
                    style={{ 
                      color: row.direction === "higherIsBetter" 
                        ? SCENARIO_COLORS[row.bestScenario]
                        : "#ff6b8a",
                    }}
                  >
                    {formatDelta(row.maxDelta, row.unit)}
                  </span>
                </td>
                <td className={styles.insightCell}>
                  <span className={styles.insightText}>{row.insight}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Visual Comparison Bars */}
      <div className={styles.barSection}>
        <h3 className={styles.barTitle}>Visual Comparison</h3>
        <div className={styles.barGrid}>
          {rows.slice(0, 6).map(row => {
            const maxVal = Math.max(row.base, row.conservative, row.growth, row.turnaround);
            return (
              <div key={row.metric} className={styles.barGroup}>
                <div className={styles.barLabel}>{row.metric}</div>
                <div className={styles.bars}>
                  {(["base", "conservative", "growth", "turnaround"] as ScenarioId[]).map(sid => {
                    const value = row[sid as keyof VarianceRow] as number;
                    const width = maxVal > 0 ? (value / maxVal) * 100 : 0;
                    return (
                      <div key={sid} className={styles.barRow}>
                        <div 
                          className={styles.bar}
                          style={{ 
                            width: `${width}%`,
                            background: SCENARIO_COLORS[sid],
                            opacity: sid === scenario ? 1 : 0.6,
                          }}
                        />
                        <span className={styles.barValue}>{formatValue(value, row.unit)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default memo(VariancesView);

