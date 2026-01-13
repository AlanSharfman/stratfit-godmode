// src/strategy/StrategyCompare.tsx
// STRATFIT — Strategy Comparison Table

import { useScenarioStore } from "@/state/scenarioStore";
import type { Strategy } from "./Strategy";
import { STRATEGY_LABEL_COLORS, calculateExitValue } from "./Strategy";

const COMPARE_METRICS = [
  { key: "enterpriseValue", label: "Valuation", format: (v: number) => `$${(v / 1_000_000).toFixed(1)}M`, fromKpis: true },
  { key: "arrNext12", label: "ARR (12mo)", format: (v: number) => `$${(v / 1_000_000).toFixed(1)}M`, fromKpis: true },
  { key: "runway", label: "Runway", format: (v: number) => `${Math.round(v)} mo`, fromKpis: true },
  { key: "cac", label: "CAC", format: (v: number) => `$${Math.round(v).toLocaleString()}`, fromKpis: true },
  { key: "ltvCac", label: "LTV/CAC", format: (v: number) => `${v.toFixed(1)}x`, fromKpis: true },
  { key: "cacPayback", label: "Payback", format: (v: number) => `${Math.round(v)} mo`, fromKpis: true },
  { key: "riskIndex", label: "Risk", format: (v: number) => `${Math.round(v)}/100`, fromKpis: true },
  { key: "burnQuality", label: "Burn", format: (v: number) => `$${Math.round(v)}K`, fromKpis: true },
  { key: "totalFunding", label: "Total Funding", format: (v: number) => v > 0 ? `$${(v / 1_000_000).toFixed(1)}M` : "None", fromKpis: false },
  { key: "fundingRounds", label: "Funding Rounds", format: (v: number) => v > 0 ? `${v} rounds` : "None", fromKpis: false },
  { key: "breakEvenMonth", label: "Break-Even", format: (v: number | null) => v !== null ? `Month ${v}` : "Not reached", fromKpis: false },
];

// Cap table and exit metrics (computed from strategy)
const CAP_TABLE_METRICS = [
  { key: "totalRaised", label: "Total Raised", getValue: (s: Strategy) => s.totalFunding, format: "currency" },
  { key: "founderPct", label: "Founder %", getValue: (s: Strategy) => s.capTable?.founders ?? 1, format: "percent" },
  { key: "investorPct", label: "Investor %", getValue: (s: Strategy) => s.capTable?.investors ?? 0, format: "percent" },
  { key: "exit8x", label: "Exit @ 8× ARR", getValue: (s: Strategy) => calculateExitValue(s, 8).enterprise, format: "currency" },
  { key: "founderProceeds", label: "Founder Proceeds", getValue: (s: Strategy) => s.founderProceeds ?? calculateExitValue(s, 8).founders, format: "currency" },
  { key: "investorProceeds", label: "Investor Proceeds", getValue: (s: Strategy) => s.investorProceeds ?? calculateExitValue(s, 8).investors, format: "currency" },
  { key: "investorIRR", label: "Investor IRR", getValue: (s: Strategy) => s.investorIRR ?? 0, format: "irr" },
];

function getMetricValue(strategy: Strategy, metricKey: string, fromKpis: boolean): number | null {
  if (fromKpis) {
    return strategy.kpis[metricKey]?.value ?? null;
  }
  // Get from strategy object directly
  const directValue = (strategy as Record<string, unknown>)[metricKey];
  if (typeof directValue === "number") return directValue;
  if (directValue === null) return null;
  return null;
}

function getBestValue(strategies: Strategy[], metricKey: string, fromKpis: boolean): number | null {
  const values = strategies
    .map(s => getMetricValue(s, metricKey, fromKpis))
    .filter((v): v is number => v !== null && v !== undefined);
  
  if (values.length === 0) return null;

  // For these metrics, lower is better
  const lowerIsBetter = ["cac", "cacPayback", "riskIndex", "burnQuality", "totalFunding", "fundingRounds"];
  
  // For break-even, earlier is better
  if (metricKey === "breakEvenMonth") {
    const validValues = values.filter(v => v > 0);
    return validValues.length > 0 ? Math.min(...validValues) : null;
  }
  
  if (lowerIsBetter.includes(metricKey)) {
    return Math.min(...values);
  }
  return Math.max(...values);
}

export function StrategyCompare() {
  const strategies = useScenarioStore((s) => s.strategies);
  const deleteStrategy = useScenarioStore((s) => s.deleteStrategy);

  if (strategies.length < 1) {
    return (
      <div style={{
        padding: 24,
        textAlign: "center",
        color: "rgba(160,200,255,0.5)",
        fontSize: 14,
      }}>
        No saved strategies yet. Save a strategy to start comparing.
      </div>
    );
  }

  return (
    <div style={{
      background: "rgba(10,15,24,0.9)",
      borderRadius: 12,
      border: "1px solid rgba(120,180,255,0.15)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid rgba(120,180,255,0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <h3 style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: "#6fd3ff",
          textTransform: "uppercase",
        }}>
          Strategy Comparison
        </h3>
        <span style={{ fontSize: 12, color: "rgba(160,200,255,0.5)" }}>
          {strategies.length} saved
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
        }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(120,180,255,0.1)" }}>
              <th style={{
                padding: "12px 16px",
                textAlign: "left",
                fontWeight: 600,
                color: "rgba(160,200,255,0.7)",
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}>
                Metric
              </th>
              {strategies.map((s) => (
                <th key={s.id} style={{
                  padding: "12px 16px",
                  textAlign: "right",
                  fontWeight: 600,
                  color: "#e6f2ff",
                  minWidth: 120,
                }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <span>{s.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: `${STRATEGY_LABEL_COLORS[s.label]}22`,
                        color: STRATEGY_LABEL_COLORS[s.label],
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                      }}>
                        {s.label}
                      </span>
                      <span style={{
                        fontSize: 10,
                        color: "rgba(160,200,255,0.5)",
                        fontWeight: 400,
                      }}>
                        {s.scenario}
                      </span>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE_METRICS.map((metric) => {
              const bestValue = getBestValue(strategies, metric.key, metric.fromKpis);
              
              return (
                <tr key={metric.key} style={{
                  borderBottom: "1px solid rgba(120,180,255,0.05)",
                }}>
                  <td style={{
                    padding: "10px 16px",
                    color: "rgba(160,200,255,0.8)",
                    fontWeight: 500,
                  }}>
                    {metric.label}
                  </td>
                  {strategies.map((s) => {
                    const value = getMetricValue(s, metric.key, metric.fromKpis);
                    const isBest = value !== null && value === bestValue;
                    
                    // Special handling for break-even (null means not reached)
                    const displayValue = metric.key === "breakEvenMonth" 
                      ? metric.format(value)
                      : value !== null 
                        ? metric.format(value) 
                        : "—";
                    
                    // For funding metrics, "None" is best
                    const isNoneBest = (metric.key === "totalFunding" || metric.key === "fundingRounds") 
                      && value === 0;
                    
                    return (
                      <td key={s.id} style={{
                        padding: "10px 16px",
                        textAlign: "right",
                        color: (isBest || isNoneBest) ? "#6fffd2" : "#e6f2ff",
                        fontWeight: (isBest || isNoneBest) ? 700 : 400,
                        background: (isBest || isNoneBest) ? "rgba(111,255,210,0.05)" : "transparent",
                      }}>
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Section Divider: Cap Table & Exit */}
            <tr style={{ borderBottom: "2px solid rgba(120,180,255,0.15)" }}>
              <td colSpan={strategies.length + 1} style={{
                padding: "8px 16px",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(250,204,21,0.8)",
                background: "rgba(250,204,21,0.05)",
              }}>
                💰 Cap Table & Exit (8× ARR)
              </td>
            </tr>

            {/* Cap Table Metrics */}
            {CAP_TABLE_METRICS.map((metric) => {
              const values = strategies.map(s => metric.getValue(s));
              
              // Determine what's "best" for each metric
              const higherIsBetter = ["founderPct", "exit8x", "founderProceeds", "investorIRR"].includes(metric.key);
              const lowerIsBetter = ["totalRaised", "investorPct"].includes(metric.key);
              
              let bestValue: number;
              if (higherIsBetter) {
                bestValue = Math.max(...values);
              } else if (lowerIsBetter) {
                bestValue = Math.min(...values.filter(v => v > 0)); // Exclude zero for "lower is better"
              } else {
                bestValue = Math.max(...values);
              }
              
              return (
                <tr key={metric.key} style={{
                  borderBottom: "1px solid rgba(120,180,255,0.05)",
                }}>
                  <td style={{
                    padding: "10px 16px",
                    color: "rgba(250,204,21,0.75)",
                    fontWeight: 500,
                  }}>
                    {metric.label}
                  </td>
                  {strategies.map((s, i) => {
                    const value = values[i];
                    const isBest = value === bestValue && value > 0;
                    
                    // Format based on metric format type
                    let displayValue = "—";
                    if (metric.format === "percent") {
                      displayValue = `${(value * 100).toFixed(1)}%`;
                    } else if (metric.format === "irr") {
                      displayValue = value > 0 ? `${(value * 100).toFixed(0)}%` : "N/A";
                    } else if (metric.format === "currency") {
                      if (value === 0) {
                        displayValue = metric.key === "totalRaised" ? "None" : "$0";
                      } else if (value >= 1_000_000) {
                        displayValue = `$${(value / 1_000_000).toFixed(1)}M`;
                      } else if (value >= 1_000) {
                        displayValue = `$${(value / 1_000).toFixed(0)}K`;
                      } else {
                        displayValue = `$${value.toFixed(0)}`;
                      }
                    }
                    
                    // Special: "None" funding is best
                    const isNoneBest = metric.key === "totalRaised" && value === 0;
                    
                    return (
                      <td key={s.id} style={{
                        padding: "10px 16px",
                        textAlign: "right",
                        color: (isBest || isNoneBest) ? "#fcd34d" : "#e6f2ff",
                        fontWeight: (isBest || isNoneBest) ? 700 : 400,
                        background: (isBest || isNoneBest) ? "rgba(250,204,21,0.08)" : "transparent",
                      }}>
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Strategy Actions */}
      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid rgba(120,180,255,0.1)",
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
      }}>
        {strategies.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              if (confirm(`Delete "${s.name}"?`)) {
                deleteStrategy(s.id);
              }
            }}
            style={{
              padding: "6px 12px",
              fontSize: 11,
              borderRadius: 6,
              border: "1px solid rgba(255,120,150,0.3)",
              background: "rgba(255,120,150,0.1)",
              color: "rgba(255,120,150,0.9)",
              cursor: "pointer",
              transition: "all 120ms ease",
            }}
          >
            Delete {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default StrategyCompare;

