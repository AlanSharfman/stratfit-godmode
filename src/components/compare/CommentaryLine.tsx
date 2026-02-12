// src/components/compare/CommentaryLine.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Single-Line Structured Commentary Engine
//
// 60% metric referential, 40% structured framing.
// Never advisory. Never warning.
// Single line only. Positioned below table. No floating overlays.
// ═══════════════════════════════════════════════════════════════════════════

import React, { memo, useMemo } from "react";
import type { MetricsResult } from "@/logic/calculateMetrics";
import type { MonteCarloResult } from "@/logic/monteCarloEngine";
import styles from "./CompareView.module.css";

interface CommentaryLineProps {
  leftMetrics: MetricsResult | null;
  rightMetrics: MetricsResult | null;
  leftSim: MonteCarloResult | null;
  rightSim: MonteCarloResult | null;
  leftName: string;
  rightName: string;
}

const CommentaryLine: React.FC<CommentaryLineProps> = memo(({
  leftMetrics,
  rightMetrics,
  leftSim,
  rightSim,
  leftName,
  rightName,
}) => {
  const commentary = useMemo(() => {
    if (!leftMetrics || !rightMetrics) return null;

    const runwayDelta = rightMetrics.runway - leftMetrics.runway;
    const evDelta = rightMetrics.enterpriseValue - leftMetrics.enterpriseValue;
    const riskDelta = rightMetrics.riskIndex - leftMetrics.riskIndex;

    const survivalL = leftSim
      ? Math.round(leftSim.survivalRate * 100)
      : Math.min(100, Math.round((leftMetrics.runway / 36) * 100));
    const survivalR = rightSim
      ? Math.round(rightSim.survivalRate * 100)
      : Math.min(100, Math.round((rightMetrics.runway / 36) * 100));
    const survivalDelta = survivalR - survivalL;

    // Generate commentary — 60% metric referential, 40% structured framing
    const parts: string[] = [];

    // Survival commentary
    if (Math.abs(survivalDelta) > 2) {
      if (survivalDelta > 0) {
        parts.push(`Survival increases to ${survivalR}%`);
      } else {
        parts.push(`Survival declines to ${survivalR}%`);
      }
    }

    // Runway commentary
    if (Math.abs(runwayDelta) > 1) {
      if (runwayDelta > 0) {
        parts.push(`extending runway by ${runwayDelta} month${runwayDelta !== 1 ? "s" : ""}`);
      } else {
        parts.push(`reducing runway by ${Math.abs(runwayDelta)} month${Math.abs(runwayDelta) !== 1 ? "s" : ""}`);
      }
    }

    // EV commentary
    if (Math.abs(evDelta) > 1) {
      if (evDelta > 0) {
        parts.push("enterprise value improves");
      } else {
        parts.push("enterprise value declines");
      }
    }

    // Risk resilience commentary
    if (Math.abs(riskDelta) > 3) {
      if (riskDelta < 0) {
        parts.push("with improved structural resilience");
      } else {
        parts.push("with moderate reduction in structural resilience");
      }
    }

    if (parts.length === 0) {
      return `${rightName} shows minimal structural deviation from ${leftName}.`;
    }

    // Join first part capitalized, rest joined with commas
    const sentence = parts.join(", ") + ".";
    return sentence.charAt(0).toUpperCase() + sentence.slice(1);
  }, [leftMetrics, rightMetrics, leftSim, rightSim, leftName, rightName]);

  return (
    <div className={styles.commentaryRow}>
      {commentary ? (
        <p className={styles.commentaryText}>{commentary}</p>
      ) : (
        <p className={styles.commentaryEmpty}>Run a scenario to generate structural commentary.</p>
      )}
    </div>
  );
});

CommentaryLine.displayName = "CommentaryLine";
export default CommentaryLine;







