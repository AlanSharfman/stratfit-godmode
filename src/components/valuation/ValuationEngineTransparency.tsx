// src/components/valuation/ValuationEngineTransparency.tsx
// STRATFIT — Layer 6: Engine Transparency + Range Discipline (expandable model details)
// Includes: Model Details + Range Discipline disclosure.

import { useState } from "react";
import styles from "./ValuationPage.module.css";

interface ValuationEngineTransparencyProps {
  iterations: number;
  horizonMonths: number;
  discountRate: number;
  terminalGrowth: number;
  seed: string;
  // Range discipline
  isFromRealDistribution?: boolean;
  winsorisationApplied?: boolean;
  winsorLow?: number;
  winsorHigh?: number;
  displayPercentiles?: string; // e.g. "p10–p90"
}

const fmt = (v: number): string => {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
};

export default function ValuationEngineTransparency({
  iterations,
  horizonMonths,
  discountRate,
  terminalGrowth,
  seed,
  isFromRealDistribution = false,
  winsorisationApplied = false,
  winsorLow = 0,
  winsorHigh = 0,
  displayPercentiles = "p10–p90",
}: ValuationEngineTransparencyProps) {
  const [openModel, setOpenModel] = useState(false);
  const [openDiscipline, setOpenDiscipline] = useState(false);

  return (
    <>
      {/* ── Model Details ── */}
      <div className={styles.expandableSection}>
        <div className={styles.expandableHeader} onClick={() => setOpenModel(!openModel)}>
          <span className={styles.expandableTitle}>Model Details</span>
          <span className={`${styles.expandableChevron} ${openModel ? styles.expandableChevronOpen : ""}`}>
            ▾
          </span>
        </div>
        {openModel && (
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

      {/* ── Range Discipline ── */}
      <div className={styles.expandableSection}>
        <div className={styles.expandableHeader} onClick={() => setOpenDiscipline(!openDiscipline)}>
          <span className={styles.expandableTitle}>Range Discipline</span>
          <span className={`${styles.expandableChevron} ${openDiscipline ? styles.expandableChevronOpen : ""}`}>
            ▾
          </span>
        </div>
        {openDiscipline && (
          <div className={styles.expandableBody}>
            <div className={styles.disciplineContent}>
              <div className={styles.disciplineRow}>
                <span className={styles.disciplineLabel}>Distribution source</span>
                <span className={styles.disciplineValue}>
                  {isFromRealDistribution ? "Monte Carlo empirical" : "Synthetic normal approximation"}
                </span>
              </div>
              <div className={styles.disciplineRow}>
                <span className={styles.disciplineLabel}>Display percentiles</span>
                <span className={styles.disciplineValue}>{displayPercentiles}</span>
              </div>
              <div className={styles.disciplineRow}>
                <span className={styles.disciplineLabel}>Winsorisation</span>
                <span className={styles.disciplineValue}>
                  {winsorisationApplied ? (
                    <>
                      Applied at P5/P95 · Display clamped to {fmt(winsorLow)} – {fmt(winsorHigh)}
                    </>
                  ) : (
                    "Not applied"
                  )}
                </span>
              </div>
              <div className={styles.disciplineRow}>
                <span className={styles.disciplineLabel}>Unit normalisation</span>
                <span className={styles.disciplineValue}>
                  All values in USD · ARR-based · Annualised revenue × method-specific multiple
                </span>
              </div>
              <div className={styles.disciplineRow}>
                <span className={styles.disciplineLabel}>Multiple bounds</span>
                <span className={styles.disciplineValue}>
                  ARR multiple capped at stage-specific sane bounds · DCF terminal growth ≤ 5%
                </span>
              </div>
              <p className={styles.disciplineNote}>
                Percentile ranges represent the probability-weighted distribution of enterprise value
                outcomes. P50 (median) is the headline estimate. The operating range (P25–P75)
                contains the central 50% of outcomes. The stress range (P10–P90) covers 80% of
                outcomes after winsorisation removes extreme outliers at both tails.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
