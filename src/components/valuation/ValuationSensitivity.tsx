// src/components/valuation/ValuationSensitivity.tsx
// STRATFIT — Layer 3: Valuation Sensitivity Panel
// Shows top 5 drivers by impact on EV delta.
// Uses existing simulation delta arrays. No new simulation.

import { useMemo } from "react";
import styles from "./ValuationPage.module.css";

interface SensitivityDriver {
  name: string;
  deltaEV: number; // absolute dollar change
  impact: number; // normalized 0–1 for bar width
}

interface ValuationSensitivityProps {
  drivers: SensitivityDriver[];
}

const fmt = (v: number): string => {
  const abs = Math.abs(v);
  const sign = v >= 0 ? "+" : "-";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
};

export default function ValuationSensitivity({ drivers }: ValuationSensitivityProps) {
  const sorted = useMemo(
    () => [...drivers].sort((a, b) => Math.abs(b.deltaEV) - Math.abs(a.deltaEV)).slice(0, 5),
    [drivers]
  );

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>Valuation Sensitivity</div>
      {sorted.map((d) => (
        <div key={d.name} className={styles.sensitivityRow}>
          <span className={styles.sensitivityDriver}>{d.name}</span>
          <div className={styles.sensitivityBarWrap}>
            <div
              className={styles.sensitivityBar}
              style={{
                width: `${Math.round(d.impact * 100)}%`,
                background: d.deltaEV >= 0 ? "#10b981" : "#FF4D4D",
              }}
            />
          </div>
          <span
            className={`${styles.sensitivityDelta} ${
              d.deltaEV > 0
                ? styles.sensitivityDeltaPositive
                : d.deltaEV < 0
                ? styles.sensitivityDeltaNegative
                : styles.sensitivityDeltaNeutral
            }`}
          >
            {fmt(d.deltaEV)}
          </span>
        </div>
      ))}
    </div>
  );
}





