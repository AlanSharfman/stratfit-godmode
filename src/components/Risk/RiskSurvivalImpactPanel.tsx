// src/components/Risk/RiskSurvivalImpactPanel.tsx
// STRATFIT — Risk → Survival Linkage Panel
// Derived from risk factor scores and survival delta. No new math.

import React, { useMemo } from "react";
import styles from "./RiskPage.module.css";
import type { RiskFactor } from "@/state/riskStore";

interface RiskSurvivalImpactPanelProps {
  factors: RiskFactor[];
  survivalRate: number;
  medianRunway: number;
}

const RiskSurvivalImpactPanel: React.FC<RiskSurvivalImpactPanelProps> = ({
  factors,
  survivalRate,
  medianRunway,
}) => {
  const lines = useMemo(() => {
    const statements: string[] = [];

    // Sort by score descending
    const sorted = [...factors].sort((a, b) => b.score - a.score);

    // Top 3 risk → survival statements
    sorted.slice(0, 3).forEach((f) => {
      const impactPp = Math.round(f.score * 0.18); // proportional proxy
      if (f.category === "market") {
        statements.push(`Market risk reduces survival probability by ~${impactPp}pp under stress scenarios.`);
      } else if (f.category === "execution") {
        statements.push(`Execution risk increases variance beyond month 18. Score: ${f.score}/100.`);
      } else if (f.category === "funding") {
        statements.push(`Funding compression increases downside EV tail. Current pressure: ${f.score}/100.`);
      } else if (f.category === "runway") {
        if (medianRunway < 18) {
          statements.push(`Runway risk is elevated. ${medianRunway.toFixed(0)} months remaining compresses strategic optionality.`);
        } else {
          statements.push(`Runway risk contributes ${impactPp}pp to survival variance. ${medianRunway.toFixed(0)} months remaining.`);
        }
      } else if (f.category === "churn") {
        statements.push(`Churn risk narrows revenue base stability. Net retention sensitivity: ${f.score}/100.`);
      } else if (f.category === "competition") {
        statements.push(`Competitive pressure constrains pricing power. Market exposure: ${f.score}/100.`);
      }
    });

    // Survival summary
    if (survivalRate < 0.5) {
      statements.push(`Aggregate risk profile suggests survival probability below 50%. Immediate structural review recommended.`);
    } else if (survivalRate > 0.8) {
      statements.push(`Risk exposure is contained. Survival probability remains above 80%.`);
    }

    return statements.slice(0, 4);
  }, [factors, survivalRate, medianRunway]);

  return (
    <div className={styles.survivalPanel}>
      <div className={styles.panelTitle}>Risk Impact on Survival</div>
      {lines.map((line, i) => (
        <div key={i} className={styles.impactLine}>
          {line}
        </div>
      ))}
    </div>
  );
};

export default RiskSurvivalImpactPanel;





