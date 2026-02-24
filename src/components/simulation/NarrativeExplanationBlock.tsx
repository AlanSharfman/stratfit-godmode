import React, { useMemo } from "react";
import styles from "./NarrativeExplanationBlock.module.css";
import { useSimulationSelectors } from "@/core/selectors/useSimulationSelectors";
import { buildNarrativeFromCanonical } from "@/simulation/buildNarrativeFromCanonical";

// valuationP50/Low/High from selectors are distribution arrays — extract midpoint scalar.
function mid(arr: number[]): number | undefined {
  if (!arr.length) return undefined;
  return arr[Math.floor(arr.length / 2)];
}

export default function NarrativeExplanationBlock() {
  const {
    survivalProbability,
    confidenceIndex,
    volatility,
    runwayMonths,
    valuationP50,
    valuationLow,
    valuationHigh,
  } = useSimulationSelectors();

  // Widen deps to full array refs — React Compiler requires object-level deps.
  const narrative = useMemo(
    () =>
      buildNarrativeFromCanonical({
        survivalProbability,
        confidenceIndex,
        volatility,
        runwayMonths,
        valuationP50: mid(valuationP50),
        valuationLow: mid(valuationLow),
        valuationHigh: mid(valuationHigh),
      }),
    [
      survivalProbability,
      confidenceIndex,
      volatility,
      runwayMonths,
      valuationP50,
      valuationLow,
      valuationHigh,
    ]
  );

  if (!survivalProbability) return null;

  return (
    <div className={styles.panel}>
      <div className={styles.headline}>{narrative.headline}</div>

      <div className={styles.section}>
        <p>{narrative.summary}</p>
      </div>

      <div className={styles.section}>
        <strong>Risk Outlook</strong>
        <p>{narrative.riskCommentary}</p>
      </div>

      <div className={styles.section}>
        <strong>Valuation Perspective</strong>
        <p>{narrative.valuationCommentary}</p>
      </div>
    </div>
  );
}
