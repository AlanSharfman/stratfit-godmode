// src/components/compound/variances2/OverviewPanel.tsx
import React, { useMemo } from "react";
import styles from "./VariancesHub.module.css";
import MiniMountainComparison from "@/components/compound/variances/MiniMountainComparison";
import { buildCompactMetricRows } from "./shared";
import { useScenarioStore } from "@/state/scenarioStore";
import { useShallow } from "zustand/react/shallow";

export default function OverviewPanel() {
  const { engineResultsByScenario } = useScenarioStore(
    useShallow((s) => ({
      engineResultsByScenario: s.engineResultsByScenario,
    }))
  );

  const rows = useMemo(() => buildCompactMetricRows(engineResultsByScenario || {}), [engineResultsByScenario]);

  return (
    <div className={styles.body}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Executive Summary</div>
        <div className={styles.muted}>
          (Phase 3 will enforce: AI refresh only on explicit action / scenario change — never on slider drag.)
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Scenario Spread</div>
        <MiniMountainComparison />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Key Metrics (compact)</div>

        {/* Vertical, CFO-friendly table (not horizontally "repetitive") */}
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Metric</th>
              <th className={styles.th}>Base</th>
              <th className={styles.th}>Best</th>
              <th className={styles.th}>Worst</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const values = [
                { label: "Upside", v: r.upside },
                { label: "Downside", v: r.downside },
                { label: "Stress", v: r.stress },
              ];

              // Best/worst based on string comparison is NOT safe.
              // We do NOT infer ranking here (no guessing).
              // Phase 2.2 will compute ranking using real numeric fields.
              const best = "—";
              const worst = "—";

              return (
                <tr key={r.label} className={idx === rows.length - 1 ? styles.lastRow : undefined}>
                  <td className={`${styles.td} ${styles.rowLabel}`}>{r.label}</td>
                  <td className={styles.td}>{r.base}</td>
                  <td className={styles.td}>{best}</td>
                  <td className={styles.td}>{worst}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className={styles.muted} style={{ marginTop: 10 }}>
          Best/Worst will be enabled in Phase 2.2 using numeric comparisons from EngineResults (no assumptions).
        </div>
      </div>
    </div>
  );
}
