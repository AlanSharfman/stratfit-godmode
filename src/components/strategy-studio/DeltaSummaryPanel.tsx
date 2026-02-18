// src/components/strategy-studio/DeltaSummaryPanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Delta Summary Panel (Right Side)
// Survival Δ · EV Δ · Runway Δ · Risk Δ
// Derived from simulation + calculateMetrics. Not static.
// Institutional data density. No emojis. No hype.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo } from "react";
import styles from "./StrategyStudio.module.css";
import type { MonteCarloResult, SensitivityFactor } from "@/logic/monteCarloEngine";
import DeltaEmphasis from "@/scene/studio/DeltaEmphasis";
import "@/scene/studio/deltaEmphasis.css";

// ── Types ─────────────────────────────────────────────────────────────────

export interface DeltaMetrics {
  survival: { baseline: number; scenario: number; delta: number };
  ev: { baseline: number; scenario: number; delta: number };
  runway: { baseline: number; scenario: number; delta: number };
  risk: { baseline: number; scenario: number; delta: number };
}

interface DeltaSummaryPanelProps {
  deltas: DeltaMetrics;
  scenarioLabel: string;
  isAutoSimming: boolean;
  compareMode: boolean;
  autoSimResult: MonteCarloResult | null;
}

// ── Formatters ──────────────────────────────────────────────────────────

function fmtDelta(value: number, suffix: string = ""): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${Math.round(value * 10) / 10}${suffix}`;
}

function fmtEv(v: number): string {
  if (v >= 1_000_000) return "$" + (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return "$" + (v / 1_000).toFixed(0) + "K";
  return "$" + Math.round(v).toLocaleString();
}

function fmtEvCompact(v: number): string {
  // Scale for display — enterpriseValue from calculateMetrics is a small number
  return fmtEv(v * 100_000);
}

function deltaColorClass(delta: number, inverted: boolean = false): string {
  const effectiveDelta = inverted ? -delta : delta;
  if (effectiveDelta > 0) return styles.deltaPositive;
  if (effectiveDelta < 0) return styles.deltaNegative;
  return styles.deltaZero;
}

// ── Main Component ──────────────────────────────────────────────────────

export const DeltaSummaryPanel: React.FC<DeltaSummaryPanelProps> = memo(({
  deltas,
  scenarioLabel,
  isAutoSimming,
  compareMode,
  autoSimResult,
}) => {
  const topDrivers: SensitivityFactor[] = autoSimResult?.sensitivityFactors
    ?.slice(0, 3) ?? [];

  return (
    <DeltaEmphasis>
      {/* Header */}
      <div className={styles.deltaHeader}>
        <div className={styles.deltaTitle}>
          Delta Summary
          {compareMode && <span className={styles.compareBadge}>A vs B</span>}
        </div>
        <div className={styles.deltaSubtitle}>
          {compareMode ? "Scenario A vs Scenario B" : `${scenarioLabel} vs Baseline`}
        </div>
      </div>

      {/* Survival Δ */}
      <div className={styles.deltaCard}>
        <div className={styles.deltaCardTitle}>Survival</div>
        <div className={styles.deltaCardRow}>
          <div className={styles.deltaCardValues}>
            <span className={styles.deltaCardBaselineValue}>{Math.round(deltas.survival.baseline)}%</span>
            <span className={styles.deltaCardArrow}>→</span>
            <span className={styles.deltaCardScenarioValue}>{Math.round(deltas.survival.scenario)}%</span>
          </div>
          <span className={`${styles.deltaCardDelta} ${deltaColorClass(deltas.survival.delta)}`}>
            {fmtDelta(deltas.survival.delta, "%pts")}
          </span>
        </div>
        {/* Percentile strip from sim results */}
        {autoSimResult && (
          <div className={styles.percentileStrip}>
            <span className={styles.percentileTag}>P10</span>
            <span className={styles.percentileValue}>
              {Math.round(autoSimResult.survivalByMonth[autoSimResult.survivalByMonth.length - 1] * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* EV Δ */}
      <div className={styles.deltaCard}>
        <div className={styles.deltaCardTitle}>Enterprise Value</div>
        <div className={styles.deltaCardRow}>
          <div className={styles.deltaCardValues}>
            <span className={styles.deltaCardBaselineValue}>{fmtEvCompact(deltas.ev.baseline)}</span>
            <span className={styles.deltaCardArrow}>→</span>
            <span className={styles.deltaCardScenarioValue}>{fmtEvCompact(deltas.ev.scenario)}</span>
          </div>
          <span className={`${styles.deltaCardDelta} ${deltaColorClass(deltas.ev.delta)}`}>
            {deltas.ev.baseline !== 0
              ? fmtDelta(((deltas.ev.scenario - deltas.ev.baseline) / deltas.ev.baseline) * 100, "%")
              : "—"}
          </span>
        </div>
        {/* ARR percentile from sim */}
        {autoSimResult && (
          <div className={styles.percentileStrip}>
            <span className={styles.percentileTag}>P10</span>
            <span className={styles.percentileValue}>{fmtEv(autoSimResult.arrPercentiles.p10)}</span>
            <span className={styles.percentileTag}>P50</span>
            <span className={styles.percentileValue}>{fmtEv(autoSimResult.arrPercentiles.p50)}</span>
            <span className={styles.percentileTag}>P90</span>
            <span className={styles.percentileValue}>{fmtEv(autoSimResult.arrPercentiles.p90)}</span>
          </div>
        )}
      </div>

      {/* Runway Δ */}
      <div className={styles.deltaCard}>
        <div className={styles.deltaCardTitle}>Runway</div>
        <div className={styles.deltaCardRow}>
          <div className={styles.deltaCardValues}>
            <span className={styles.deltaCardBaselineValue}>{Math.round(deltas.runway.baseline)}mo</span>
            <span className={styles.deltaCardArrow}>→</span>
            <span className={styles.deltaCardScenarioValue}>{Math.round(deltas.runway.scenario)}mo</span>
          </div>
          <span className={`${styles.deltaCardDelta} ${deltaColorClass(deltas.runway.delta)}`}>
            {fmtDelta(deltas.runway.delta, "mo")}
          </span>
        </div>
        {/* Runway percentile from sim */}
        {autoSimResult && (
          <div className={styles.percentileStrip}>
            <span className={styles.percentileTag}>P10</span>
            <span className={styles.percentileValue}>{Math.round(autoSimResult.runwayPercentiles.p10)}mo</span>
            <span className={styles.percentileTag}>P50</span>
            <span className={styles.percentileValue}>{Math.round(autoSimResult.runwayPercentiles.p50)}mo</span>
            <span className={styles.percentileTag}>P90</span>
            <span className={styles.percentileValue}>{Math.round(autoSimResult.runwayPercentiles.p90)}mo</span>
          </div>
        )}
      </div>

      {/* Risk Δ */}
      <div className={styles.deltaCard}>
        <div className={styles.deltaCardTitle}>Risk Index</div>
        <div className={styles.deltaCardRow}>
          <div className={styles.deltaCardValues}>
            <span className={styles.deltaCardBaselineValue}>{Math.round(deltas.risk.baseline)}</span>
            <span className={styles.deltaCardArrow}>→</span>
            <span className={styles.deltaCardScenarioValue}>{Math.round(deltas.risk.scenario)}/100</span>
          </div>
          <span className={`${styles.deltaCardDelta} ${deltaColorClass(deltas.risk.delta, true)}`}>
            {fmtDelta(deltas.risk.delta)}
          </span>
        </div>
      </div>

      {/* Top Sensitivity Drivers */}
      {topDrivers.length > 0 && (
        <div className={styles.sensitivitySection}>
          <div className={styles.sensitivityTitle}>Top Sensitivity Drivers</div>
          {topDrivers.map((driver, i) => (
            <div key={i} className={styles.sensitivityRow}>
              <span className={styles.sensitivityLabel}>{driver.label}</span>
              <span
                className={styles.sensitivityImpact}
                style={{ color: driver.direction === "positive" ? "#34d399" : "#f87171" }}
              >
                {driver.impact > 0 ? "+" : ""}{(driver.impact * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Simulation Activity Indicator */}
      <div className={styles.simActivity}>
        <div className={isAutoSimming ? styles.simActivityDotActive : styles.simActivityDot} />
        <span className={isAutoSimming ? styles.simActivityTextActive : styles.simActivityText}>
          {isAutoSimming
            ? "Recalculating…"
            : autoSimResult
              ? `Last run: ${autoSimResult.iterations.toLocaleString()} paths · ${autoSimResult.timeHorizonMonths}mo`
              : "Awaiting lever adjustment"}
        </span>
      </div>
    </DeltaEmphasis>
  );
});

DeltaSummaryPanel.displayName = "DeltaSummaryPanel";

