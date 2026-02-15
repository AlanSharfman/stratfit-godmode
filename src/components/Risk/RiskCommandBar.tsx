// src/components/Risk/RiskCommandBar.tsx
// STRATFIT — Risk Command Bar
// RISK INDEX: 35/100 · TREND: Improving/Deteriorating/Stable · VOLATILITY: Low/Medium/High

import React from "react";
import styles from "./RiskPage.module.css";

interface RiskCommandBarProps {
  score: number;
  trend: "improving" | "stable" | "deteriorating";
  volatility: "low" | "medium" | "high";
}

function getRiskClass(score: number): string {
  if (score <= 15) return styles.riskMinimal;
  if (score <= 30) return styles.riskLow;
  if (score <= 45) return styles.riskModerate;
  if (score <= 60) return styles.riskElevated;
  if (score <= 80) return styles.riskHigh;
  return styles.riskCritical;
}

const RiskCommandBar: React.FC<RiskCommandBarProps> = ({ score, trend, volatility }) => {
  const trendLabel = trend === "improving" ? "Improving" : trend === "deteriorating" ? "Deteriorating" : "Stable";
  const trendClass = trend === "improving" ? styles.trendImproving : trend === "deteriorating" ? styles.trendDeteriorating : styles.trendStable;
  const trendArrow = trend === "improving" ? "↓" : trend === "deteriorating" ? "↑" : "→";

  const volClass = volatility === "low" ? styles.volLow : volatility === "high" ? styles.volHigh : styles.volMedium;
  const volLabel = volatility.charAt(0).toUpperCase() + volatility.slice(1);

  return (
    <div className={styles.commandBar}>
      <div className={styles.commandLeft}>
        <span className={styles.commandLabel}>Risk Index</span>
        <span className={`${styles.commandScore} ${getRiskClass(score)}`}>
          {score}
          <span className={styles.commandScoreSuffix}>/100</span>
        </span>
      </div>

      <div className={styles.commandRight}>
        <div className={styles.commandMeta}>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Trend</span>
            <span className={`${styles.metaArrow} ${trendClass}`}>{trendArrow}</span>
            <span className={`${styles.metaValue} ${trendClass}`}>{trendLabel}</span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Volatility</span>
            <span className={`${styles.metaValue} ${volClass}`}>{volLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskCommandBar;





