// src/components/compound/variances2/OverviewPanel.tsx
import React, { useMemo } from "react";
import styles from "./VariancesHub.module.css";
import MiniMountainComparison from "@/components/compound/variances/MiniMountainComparison";
import { buildCompactMetricRows, titleForScenario } from "./shared";
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
        <div className={styles.sectionTitle}>AI Strategic Summary</div>
        <div className={styles.muted}>
          Summary is shown here. (Phase 3 will enforce "refresh only on explicit action / scenario change", not slider drag.)
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Scenario Comparison</div>
        <MiniMountainComparison />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Key Deltas (compact)</div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Metric</th>
              <th className={styles.th}>{titleForScenario("base")}</th>
              <th className={styles.th}>{titleForScenario("upside")}</th>
              <th className={styles.th}>{titleForScenario("downside")}</th>
              <th className={styles.th}>{titleForScenario("stress")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.label} className={idx === rows.length - 1 ? styles.lastRow : undefined}>
                <td className={`${styles.td} ${styles.rowLabel}`}>{r.label}</td>
                <td className={styles.td}>{r.base}</td>
                <td className={styles.td}>{r.upside}</td>
                <td className={styles.td}>{r.downside}</td>
                <td className={styles.td}>{r.stress}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.muted} style={{ marginTop: 10 }}>
          If any value shows "—", the underlying EngineResults field path is missing. We'll map the correct fields in Phase 2.2 without changing math.
        </div>
      </div>
    </div>
  );
}
