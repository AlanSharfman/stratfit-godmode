// src/strategy/StrategyCompare.tsx
// STRATFIT — Strategy Comparison Table

import { useScenarioStore } from "@/state/scenarioStore";
import type { Strategy } from "./Strategy";
import { STRATEGY_LABEL_COLORS, calculateExitValue } from "./Strategy";

// -----------------------------------------------------------------------------
// Local type helpers (editor-only safety, no runtime risk)
// ----------------------------------------------------------------------------

type UnknownRecord = Record<string, unknown>;

function isUnknownRecord(v: unknown): v is UnknownRecord {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Safely view a typed object as a key/value bag (only if it's truly an object).
 * Avoids the incorrect "Strategy -> Record<string, unknown>" cast that TS rejects.
 */
function toUnknownRecord<T extends object>(obj: T): UnknownRecord {
  const v: unknown = obj;
  return isUnknownRecord(v) ? v : {};
}

/**
 * Normalises nullable numeric values for functions that require a `number`.
 * Choose fallback deliberately (0 is usually safest for charting / display).
 */
function num(n: number | null | undefined, fallback = 0): number {
  return n ?? fallback;
}

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
  const directValue = toUnknownRecord(strategy)[metricKey];
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
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.2 }}>Strategy Compare</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            Compare strategies across key metrics (values are formatted per metric rules).
          </div>
        </div>

        {/* Right-side header actions (keep if you already had controls; safe placeholder container) */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Intentionally left empty if no controls exist */}
        </div>
      </div>

      {/* Table wrapper */}
      <div style={{ overflowX: "auto", width: "100%" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "10px 10px", fontSize: 12, opacity: 0.8 }}>Metric</th>

              {strategies.map((s, i) => (
                <th key={s.id ?? i} style={{ textAlign: "left", padding: "10px 10px", fontSize: 12, opacity: 0.9 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span>{s.name ?? `Strategy ${i + 1}`}</span>
                    <button
                      type="button"
                      onClick={() => deleteStrategy(s.id)}
                      title="Delete strategy"
                      aria-label="Delete strategy"
                      style={{
                        cursor: "pointer",
                        border: "1px solid rgba(255,255,255,0.14)",
                        background: "rgba(255,255,255,0.04)",
                        color: "rgba(255,255,255,0.7)",
                        borderRadius: 8,
                        padding: "2px 8px",
                        lineHeight: 1.2,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {COMPARE_METRICS.map((metric) => (
              <tr key={metric.key} style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <td style={{ padding: "10px 10px", fontSize: 12, opacity: 0.85, whiteSpace: "nowrap" }}>
                  {metric.label ?? metric.key}
                </td>

                {strategies.map((s, i) => {
                  // --- IMPORTANT: preserve your existing cell value extraction logic ---
                  // If you already have a function like getMetricValue(metric, s), keep it.
                  // Otherwise this pattern safely reads from strategy as a record without unsafe casts.
                  const rec = toUnknownRecord(s);
                  const raw = rec[metric.key];
                  const value =
                    typeof raw === "number" ? raw : raw == null ? null : Number.isFinite(Number(raw)) ? Number(raw) : null;

                  const cellText =
                    typeof metric.format === "function" ? metric.format(num(value)) : value == null ? "—" : String(value);

                  return (
                    <td key={`${metric.key}-${s.id ?? i}`} style={{ padding: "10px 10px", fontSize: 12 }}>
                      {cellText}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

