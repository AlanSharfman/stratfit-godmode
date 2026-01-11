import React, { memo, useMemo } from "react";
import styles from "./ScenarioImpactPanel.module.css";

export type MetricId =
  | "revenue"
  | "arr"
  | "valuation"
  | "grossMargin"
  | "burnRate"
  | "cashBalance"
  | "runway"
  | "riskScore"
  | string;

export type MetricFormat = "currency" | "percent" | "number" | "months" | "score";

export interface MetricRow {
  id: MetricId;
  label: string;
  format: MetricFormat;

  // base + scenario values are in "raw" units (number)
  base: number | null;
  scenario: number | null;

  // commentary string (AI/CFO) — optional
  commentary?: string;

  // direction for delta coloring (default: higherIsBetter)
  direction?: "higherIsBetter" | "lowerIsBetter";
}

function fmtCurrency(n: number) {
  // compact currency like $2.6M
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function fmtPercent(n: number) {
  return `${n.toFixed(0)}%`;
}

function fmtNumber(n: number) {
  // compact number
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(0)}K`;
  return `${sign}${abs.toFixed(0)}`;
}

function fmtMonths(n: number) {
  return `${Math.round(n)} mo`;
}

function fmtScore(n: number) {
  return `${Math.round(n)}/100`;
}

function formatByType(n: number, format: MetricFormat) {
  switch (format) {
    case "currency":
      return fmtCurrency(n);
    case "percent":
      return fmtPercent(n);
    case "months":
      return fmtMonths(n);
    case "score":
      return fmtScore(n);
    default:
      return fmtNumber(n);
  }
}

function computeDelta(base: number | null, scenario: number | null) {
  if (base === null || scenario === null) return { d: null as number | null, dp: null as number | null };
  const d = scenario - base;
  const dp = base === 0 ? null : (d / Math.abs(base)) * 100;
  return { d, dp };
}

function deltaTone(delta: number, direction: MetricRow["direction"]) {
  // Direction-aware coloring:
  // - "lowerIsBetter" (Burn Rate, CAC, Risk): negative delta = good (cyan)
  // - default "higherIsBetter" (Revenue, ARR, etc.): positive delta = good (cyan)
  if (direction === "lowerIsBetter") {
    return delta <= 0 ? "pos" : "neg";
  }
  return delta >= 0 ? "pos" : "neg";
}

export interface ScenarioImpactPanelProps {
  title?: string;
  subtitle?: string;
  rows: MetricRow[];
  rightHint?: string;
}

export const ScenarioImpactPanel = memo(function ScenarioImpactPanel({
  title = "SCENARIO DELTA SNAPSHOT",
  subtitle = "Base Case → Selected Scenario",
  rightHint = "SCROLL FOR ALL METRICS",
  rows,
}: ScenarioImpactPanelProps) {
  const computed = useMemo(() => {
    return rows.map((r) => {
      const { d, dp } = computeDelta(r.base, r.scenario);
      return { ...r, d, dp };
    });
  }, [rows]);

  return (
    <section className={styles.wrap} aria-label="Scenario Delta Snapshot">
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.kicker}>{title}</div>
          <div className={styles.sub}>{subtitle}</div>
        </div>

        <div className={styles.headerRight}>
          <span className={styles.hint}>
            <span className={styles.hintIcon} aria-hidden="true">↓</span>
            {rightHint}
          </span>
        </div>
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thMetric}>METRIC</th>
              <th className={styles.thBase}>BASE</th>
              <th className={styles.thScenario}>SCENARIO</th>
              <th className={styles.thDelta}>Δ</th>
              <th className={styles.thDeltaP}>Δ%</th>
              <th className={styles.thCommentary}>CFO COMMENTARY</th>
            </tr>
          </thead>

          <tbody>
            {computed.map((r) => {
              const hasDelta = r.d !== null && r.dp !== null;
              const tone = r.d !== null ? deltaTone(r.d, r.direction) : "muted";
              const isNoChange = r.d === 0;

              const baseText = r.base === null ? "—" : formatByType(r.base, r.format);
              const scenarioText = r.scenario === null ? "—" : formatByType(r.scenario, r.format);

              // Δ formatting: currency/number/months/score use same as format; percent uses percent points
              const deltaText =
                r.d === null ? "—" : r.format === "percent" ? `${r.d.toFixed(0)}pp` : formatByType(r.d, r.format);
              const deltaPText = r.dp === null ? "—" : fmtPercent(r.dp);

              const commentary = r.commentary?.trim()
                ? r.commentary.trim()
                : isNoChange
                  ? "No material variance from base case assumptions."
                  : "";

              return (
                <tr key={r.id} className={styles.tr}>
                  <td className={styles.tdMetric}>{r.label}</td>

                  <td className={styles.tdBase}>{baseText}</td>
                  <td className={styles.tdScenario}>{scenarioText}</td>

                  <td className={`${styles.tdDelta} ${styles[tone]}`}>
                    {hasDelta ? deltaText : "—"}
                  </td>

                  <td className={`${styles.tdDeltaP} ${styles[tone]}`}>
                    {hasDelta ? deltaPText : "—"}
                  </td>

                  <td className={`${styles.tdCommentary} ${commentary ? "" : styles.muted}`}>
                    {commentary || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
});

