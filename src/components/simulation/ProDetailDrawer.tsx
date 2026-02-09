/**
 * ProDetailDrawer.tsx
 * ════════════════════════════════════════════════════════════════════════════
 * Gated expandable drawer for Pro/Enterprise users.
 *
 * Shows (when expanded):
 *   - P10/P50/P90 value band table
 *   - Top 5 sensitivity drivers
 *   - Stress runway vs base runway
 *   - Baseline vs scenario delta table
 *
 * NOT an admin console. Does NOT include engine configs or raw traces.
 * Gated by userTier === "pro" || userTier === "enterprise" (or feature flag).
 * ════════════════════════════════════════════════════════════════════════════
 */

import React, { useState } from "react";
import { useSimulationStore } from "@/state/simulationStore";
import { useFeatureAccess } from "@/lib/freemium/plans";
import { ChevronDown, ChevronUp } from "lucide-react";
import styles from "./ProDetailDrawer.module.css";

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

const fmtCurrency = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
};

const fmtPct = (v: number) => `${Math.round(v * 100)}%`;
const fmtMo = (v: number) => `${v.toFixed(1)} mo`;

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

export default function ProDetailDrawer() {
  const { tier } = useFeatureAccess();
  const fullResult = useSimulationStore((s) => s.fullResult);
  const hasSimulated = useSimulationStore((s) => s.hasSimulated);
  const [expanded, setExpanded] = useState(false);

  // Gate: only pro and enterprise users see this
  const isEligible = (tier as string) === "pro" || (tier as string) === "enterprise";

  // Feature flag override (for demo mode)
  const featureFlagOverride =
    typeof window !== "undefined" &&
    window.localStorage.getItem("ENABLE_PRO_DRAWER") === "1";

  if (!isEligible && !featureFlagOverride) return null;
  if (!hasSimulated || !fullResult) return null;

  const {
    arrPercentiles,
    cashPercentiles,
    runwayPercentiles,
    survivalRate,
    sensitivityFactors,
  } = fullResult;

  const topDrivers = sensitivityFactors
    ?.slice()
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 5);

  return (
    <div className={styles.drawer}>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setExpanded(!expanded)}
      >
        <span className={styles.toggleLabel}>DETAILED ANALYSIS</span>
        <span className={styles.toggleTier}>PRO</span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className={styles.content}>
          {/* ── Value Band Table ── */}
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>VALUE BAND (P10 / P50 / P90)</h4>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Metric</th>
                  <th className={styles.thNum}>P10</th>
                  <th className={styles.thNum}>P50</th>
                  <th className={styles.thNum}>P90</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={styles.td}>ARR</td>
                  <td className={styles.tdNum}>{fmtCurrency(arrPercentiles.p10)}</td>
                  <td className={styles.tdNum}>{fmtCurrency(arrPercentiles.p50)}</td>
                  <td className={styles.tdNum}>{fmtCurrency(arrPercentiles.p90)}</td>
                </tr>
                <tr>
                  <td className={styles.td}>Cash</td>
                  <td className={styles.tdNum}>{fmtCurrency(cashPercentiles.p10)}</td>
                  <td className={styles.tdNum}>{fmtCurrency(cashPercentiles.p50)}</td>
                  <td className={styles.tdNum}>{fmtCurrency(cashPercentiles.p90)}</td>
                </tr>
                <tr>
                  <td className={styles.td}>Runway</td>
                  <td className={styles.tdNum}>{fmtMo(runwayPercentiles.p10)}</td>
                  <td className={styles.tdNum}>{fmtMo(runwayPercentiles.p50)}</td>
                  <td className={styles.tdNum}>{fmtMo(runwayPercentiles.p90)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* ── Survival + Runway ── */}
          <section className={styles.section}>
            <h4 className={styles.sectionTitle}>SURVIVAL & RUNWAY</h4>
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>Survival probability</span>
              <span className={styles.metricValue}>{fmtPct(survivalRate)}</span>
            </div>
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>Base runway (P50)</span>
              <span className={styles.metricValue}>{fmtMo(runwayPercentiles.p50)}</span>
            </div>
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>Stress runway (P10)</span>
              <span className={`${styles.metricValue} ${
                runwayPercentiles.p10 < 12 ? styles.metricRisk : ""
              }`}>{fmtMo(runwayPercentiles.p10)}</span>
            </div>
          </section>

          {/* ── Top 5 Sensitivity Drivers ── */}
          {topDrivers && topDrivers.length > 0 && (
            <section className={styles.section}>
              <h4 className={styles.sectionTitle}>TOP SENSITIVITY DRIVERS</h4>
              <div className={styles.driverList}>
                {topDrivers.map((d, i) => (
                  <div key={i} className={styles.driverRow}>
                    <span className={styles.driverRank}>#{i + 1}</span>
                    <span className={styles.driverLabel}>{d.label}</span>
                    <span
                      className={`${styles.driverImpact} ${
                        d.direction === "positive"
                          ? styles.driverPositive
                          : styles.driverNegative
                      }`}
                    >
                      {d.impact > 0 ? "+" : ""}
                      {(d.impact * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

