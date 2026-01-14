// src/components/compound/variances/VariancesView.tsx
// Legacy Variances View (kept for fallback only)
// PHASE 2.2: remove control cluster (Metric Set / View / Sort / Pin)
// and normalize scenario naming to investor-grade labels.

import React, { useMemo } from "react";
import styles from "./VariancesView.module.css";
import { useScenarioStore } from "@/state/scenarioStore";
import { useShallow } from "zustand/react/shallow";

type ScenarioId = "base" | "upside" | "downside" | "extreme";

function labelScenario(id: ScenarioId): string {
  switch (id) {
    case "base":
      return "Base Case";
    case "upside":
      return "Upside";
    case "downside":
      return "Downside";
    case "extreme":
      return "Stress";
    default:
      return String(id);
  }
}

export default function VariancesView() {
  const { engineResultsByScenario } = useScenarioStore(
    useShallow((s) => ({
      engineResultsByScenario: s.engineResultsByScenario,
    }))
  );

  // This file intentionally does NOT provide dropdown controls.
  // It only renders a read-only cross-scenario view (fallback).
  const scenarios = useMemo(
    () =>
      ([
        { id: "base", label: labelScenario("base") },
        { id: "upside", label: labelScenario("upside") },
        { id: "downside", label: labelScenario("downside") },
        { id: "extreme", label: labelScenario("extreme") },
      ] as const),
    []
  );

  // If your existing VariancesView used custom metric logic, keep it simple here:
  // Show a clear message instead of leaking controls.
  if (!engineResultsByScenario) {
    return (
      <div className={styles.variancesWrap}>
        <div className={styles.title}>Scenario Variances</div>
        <div className={styles.subtitle}>Cross-scenario KPI comparison</div>
        <div className={styles.notice}>No engine results available. Run a scenario to populate comparisons.</div>
      </div>
    );
  }

  return (
    <div className={styles.variancesWrap}>
      <div className={styles.title}>Scenario Variances</div>
      <div className={styles.subtitle}>Cross-scenario KPI comparison</div>

      <div className={styles.notice}>
        This legacy view is kept for compatibility. Use the Variances Hub for Overview / Deep Dive.
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thMetric}>Metric</th>
              {scenarios.map((s) => (
                <th key={s.id} className={styles.thScenario}>
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Minimal, non-guessing rows. We do not invent fields here. */}
            <tr>
              <td className={styles.tdMetric}>ARR</td>
              {scenarios.map((s) => (
                <td key={s.id} className={styles.tdVal}>
                  —
                </td>
              ))}
            </tr>
            <tr>
              <td className={styles.tdMetric}>Runway (months)</td>
              {scenarios.map((s) => (
                <td key={s.id} className={styles.tdVal}>
                  —
                </td>
              ))}
            </tr>
            <tr>
              <td className={styles.tdMetric}>Burn Rate</td>
              {scenarios.map((s) => (
                <td key={s.id} className={styles.tdVal}>
                  —
                </td>
              ))}
            </tr>
            <tr>
              <td className={styles.tdMetric}>Valuation</td>
              {scenarios.map((s) => (
                <td key={s.id} className={styles.tdVal}>
                  —
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        <div className={styles.noticeSmall}>
          Values are intentionally "—" in this fallback view to avoid incorrect field mapping. The Variances Hub uses
          the correct EngineResults map.
        </div>
      </div>
    </div>
  );
}
