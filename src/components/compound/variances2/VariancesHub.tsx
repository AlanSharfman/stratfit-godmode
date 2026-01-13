// src/components/compound/variances2/VariancesHub.tsx
import React, { useState } from "react";
import styles from "./VariancesHub.module.css";
import type { VariancesMode } from "./shared";
import OverviewPanel from "./OverviewPanel";
import DeepDiveAccordions from "./DeepDiveAccordions";

export default function VariancesHub() {
  const [mode, setMode] = useState<VariancesMode>("overview");

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <div className={styles.titleBlock}>
          <div className={styles.h1}>Cross-Scenario Comparison</div>
          <div className={styles.sub}>
            Executive scan in Overview. Expand scenarios in Deep Dive for Base → Scenario comparisons.
          </div>
        </div>

        <div className={styles.seg} aria-label="Variances mode">
          <button
            className={`${styles.segBtn} ${mode === "overview" ? styles.segBtnActive : ""}`}
            onClick={() => setMode("overview")}
            type="button"
          >
            Overview
          </button>
          <button
            className={`${styles.segBtn} ${mode === "deepdive" ? styles.segBtnActive : ""}`}
            onClick={() => setMode("deepdive")}
            type="button"
          >
            Deep Dive
          </button>
        </div>
      </div>

      {mode === "overview" ? <OverviewPanel /> : <DeepDiveAccordions />}
    </div>
  );
}
