// src/components/Risk/RiskRightPanel.tsx
// STRATFIT — Risk Right Panel
// Sections: RISK SUMMARY (counts) + TOP STRUCTURAL RISKS (detailed entries)
// Max 4 rows per entry. No paragraphs.

import React from "react";
import styles from "./RiskPage.module.css";
import type { RiskFactor, ThreatCategory } from "@/state/riskStore";

const CONTROLLABILITY: Record<ThreatCategory, string> = {
  execution: "Controllable",
  runway: "Controllable",
  churn: "Partially",
  funding: "Partially",
  market: "External",
  competition: "External",
};

const HORIZON_SENSITIVITY: Record<ThreatCategory, string> = {
  runway: "Short",
  churn: "Mid",
  execution: "Mid",
  funding: "Mid",
  market: "Long",
  competition: "Long",
};

function getScoreColor(score: number): string {
  if (score <= 30) return "#00E0FF";
  if (score <= 50) return "#fbbf24";
  if (score <= 70) return "#f97316";
  return "#FF4D4D";
}

interface RiskRightPanelProps {
  factors: RiskFactor[];
}

const RiskRightPanel: React.FC<RiskRightPanelProps> = ({ factors }) => {
  // Count by severity
  const critical = factors.filter((f) => f.level === "CRITICAL").length;
  const high = factors.filter((f) => f.level === "HIGH" || f.level === "ELEVATED").length;
  const moderate = factors.filter((f) => f.level === "MODERATE").length;
  const low = factors.filter((f) => f.level === "LOW" || f.level === "MINIMAL").length;

  // Sort by score descending
  const sorted = [...factors].sort((a, b) => b.score - a.score);

  return (
    <div className={styles.sidebar}>
      {/* RISK SUMMARY */}
      <div className={styles.sideSection}>
        <div className={styles.sideSectionTitle}>Risk Summary</div>
        <div className={styles.summaryCounts}>
          <div className={styles.countCard}>
            <span className={`${styles.countValue} ${styles.countCritical}`}>{critical}</span>
            <span className={styles.countLabel}>Critical</span>
          </div>
          <div className={styles.countCard}>
            <span className={`${styles.countValue} ${styles.countHigh}`}>{high}</span>
            <span className={styles.countLabel}>High</span>
          </div>
          <div className={styles.countCard}>
            <span className={`${styles.countValue} ${styles.countModerate}`}>{moderate}</span>
            <span className={styles.countLabel}>Moderate</span>
          </div>
          <div className={styles.countCard}>
            <span className={`${styles.countValue} ${styles.countLow}`}>{low}</span>
            <span className={styles.countLabel}>Low</span>
          </div>
        </div>
      </div>

      {/* TOP STRUCTURAL RISKS */}
      <div className={styles.sideSection}>
        <div className={styles.sideSectionTitle}>Top Structural Risks</div>
        {sorted.map((f) => {
          const trendLabel = f.trend === "improving" ? "Improving" : f.trend === "worsening" ? "Deteriorating" : "Stable";
          const trendColor = f.trend === "improving" ? "#00D084" : f.trend === "worsening" ? "#FF4D4D" : "rgba(255,255,255,0.4)";
          const ctrl = CONTROLLABILITY[f.category];
          const horizonSens = HORIZON_SENSITIVITY[f.category];

          return (
            <div key={f.id} className={styles.riskEntry}>
              <div className={styles.riskEntryHeader}>
                <span className={styles.riskEntryName}>{f.label}</span>
                <span className={styles.riskEntryScore} style={{ color: getScoreColor(f.score) }}>
                  {f.score}
                </span>
              </div>
              <div className={styles.riskEntryMeta}>
                <span className={styles.riskEntryMetaItem}>
                  Trend:
                  <span className={styles.riskEntryMetaValue} style={{ color: trendColor }}>
                    {trendLabel}
                  </span>
                </span>
                <span className={styles.riskEntryMetaItem}>
                  Control:
                  <span className={styles.riskEntryMetaValue}>{ctrl}</span>
                </span>
                <span className={styles.riskEntryMetaItem}>
                  Horizon:
                  <span className={styles.riskEntryMetaValue}>{horizonSens}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RiskRightPanel;





