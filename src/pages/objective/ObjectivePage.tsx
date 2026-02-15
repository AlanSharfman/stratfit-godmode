import React from "react";
import styles from "./ObjectivePage.module.css";

export default function ObjectivePage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>OBJECTIVE (RECOVERY MODE)</h1>
      <p className={styles.subtitle}>
        ObjectivePage.tsx was truncated (EOF). This stub restores compilation so we can fix
        rendering + mountain duplication safely.
      </p>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Severity color demo</div>
        <div className={styles.pills}>
          <span className={styles.pillGreen}>20</span>
          <span className={styles.pillCyan}>45</span>
          <span className={styles.pillAmber}>65</span>
          <span className={styles.pillRed}>85</span>
        </div>
      </div>
    </div>
  );
}
