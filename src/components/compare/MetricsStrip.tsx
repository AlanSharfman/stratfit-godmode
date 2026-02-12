// src/components/compare/MetricsStrip.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Inline Metrics Strip (Runway, Survival, Enterprise Value)
//
// Format: 79% (+11%)
// Rules:
//   - Delta snaps instantly
//   - Core value glides 200–300ms (CSS transition)
//   - No arrows, no bounce
//   - Emerald only if material improvement (>5%)
//   - Red only if material decline (>5%)
//   - Neutral otherwise
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useMemo } from "react";
import type { MetricsResult } from "@/logic/calculateMetrics";
import type { MonteCarloResult } from "@/logic/monteCarloEngine";
import styles from "./CompareView.module.css";

interface MetricsStripProps {
  leftMetrics: MetricsResult | null;
  rightMetrics: MetricsResult | null;
  leftSim: MonteCarloResult | null;
  rightSim: MonteCarloResult | null;
}

function deltaClass(delta: number, threshold: number = 5): string {
  if (delta > threshold) return styles.metricDeltaPositive;
  if (delta < -threshold) return styles.metricDeltaNegative;
  return styles.metricDeltaNeutral;
}

function formatDelta(delta: number, suffix: string = ""): string {
  const sign = delta >= 0 ? "+" : "";
  return `(${sign}${delta.toFixed(delta % 1 === 0 ? 0 : 1)}${suffix})`;
}

const MetricsStrip: React.FC<MetricsStripProps> = memo(({
  leftMetrics,
  rightMetrics,
  leftSim,
  rightSim,
}) => {
  const items = useMemo(() => {
    if (!leftMetrics || !rightMetrics) return null;

    // Runway (months)
    const runwayL = leftMetrics.runway;
    const runwayR = rightMetrics.runway;
    const runwayDelta = runwayR - runwayL;

    // Survival (percentage)
    const survivalL = leftSim
      ? Math.round(leftSim.survivalRate * 100)
      : Math.min(100, Math.round((leftMetrics.runway / 36) * 100));
    const survivalR = rightSim
      ? Math.round(rightSim.survivalRate * 100)
      : Math.min(100, Math.round((rightMetrics.runway / 36) * 100));
    const survivalDelta = survivalR - survivalL;

    // Enterprise Value
    const evL = leftMetrics.enterpriseValue;
    const evR = rightMetrics.enterpriseValue;
    const evDelta = evR - evL;
    const evDeltaPct = evL > 0 ? ((evDelta / evL) * 100) : 0;

    return [
      {
        label: "Runway",
        value: `${runwayR}mo`,
        delta: formatDelta(runwayDelta, "mo"),
        deltaClass: deltaClass(runwayDelta, 2),
      },
      {
        label: "Survival",
        value: `${survivalR}%`,
        delta: formatDelta(survivalDelta, "%"),
        deltaClass: deltaClass(survivalDelta),
      },
      {
        label: "Enterprise Value",
        value: `$${evR.toFixed(1)}M`,
        delta: formatDelta(evDeltaPct, "%"),
        deltaClass: deltaClass(evDeltaPct),
      },
    ];
  }, [leftMetrics, rightMetrics, leftSim, rightSim]);

  return (
    <div className={styles.metricsStrip}>
      {items ? (
        items.map((item) => (
          <div key={item.label} className={styles.metricItem}>
            <span className={styles.metricLabel}>{item.label}</span>
            <span className={styles.metricValue}>{item.value}</span>
            <span className={item.deltaClass}>{item.delta}</span>
          </div>
        ))
      ) : (
        <>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Runway</span>
            <span className={styles.metricEmpty}>—</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Survival</span>
            <span className={styles.metricEmpty}>—</span>
          </div>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Enterprise Value</span>
            <span className={styles.metricEmpty}>—</span>
          </div>
        </>
      )}
    </div>
  );
});

MetricsStrip.displayName = "MetricsStrip";
export default MetricsStrip;







