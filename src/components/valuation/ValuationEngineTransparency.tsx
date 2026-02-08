// src/components/valuation/ValuationEngineTransparency.tsx
// STRATFIT — Layer 6: Engine Transparency (expandable model details)
// Small. Professional.

import { useState } from "react";
import styles from "./ValuationPage.module.css";

interface ValuationEngineTransparencyProps {
  iterations: number;
  horizonMonths: number;
  discountRate: number;
  terminalGrowth: number;
  seed: string;
}

export default function ValuationEngineTransparency({
  iterations,
  horizonMonths,
  discountRate,
  terminalGrowth,
  seed,
}: ValuationEngineTransparencyProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.expandableSection}>
      <div className={styles.expandableHeader} onClick={() => setOpen(!open)}>
        <span className={styles.expandableTitle}>Model Details</span>
        <span className={`${styles.expandableChevron} ${open ? styles.expandableChevronOpen : ""}`}>
          ▾
        </span>
      </div>
      {open && (
        <div className={styles.expandableBody}>
          <div className={styles.transparencyGrid}>
            <div className={styles.transparencyItem}>
              <span className={styles.transparencyLabel}>Iterations</span>
              <span className={styles.transparencyValue}>{iterations.toLocaleString()}</span>
            </div>
            <div className={styles.transparencyItem}>
              <span className={styles.transparencyLabel}>Horizon</span>
              <span className={styles.transparencyValue}>{horizonMonths}m</span>
            </div>
            <div className={styles.transparencyItem}>
              <span className={styles.transparencyLabel}>Discount Rate</span>
              <span className={styles.transparencyValue}>{discountRate.toFixed(1)}%</span>
            </div>
            <div className={styles.transparencyItem}>
              <span className={styles.transparencyLabel}>Terminal Growth</span>
              <span className={styles.transparencyValue}>{terminalGrowth.toFixed(1)}%</span>
            </div>
            <div className={styles.transparencyItem}>
              <span className={styles.transparencyLabel}>Seed</span>
              <span className={styles.transparencyValue}>{seed}</span>
            </div>
            <div className={styles.transparencyItem}>
              <span className={styles.transparencyLabel}>Engine</span>
              <span className={styles.transparencyValue}>STRATFIT v1</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}





