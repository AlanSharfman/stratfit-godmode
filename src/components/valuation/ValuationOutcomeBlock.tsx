// src/components/valuation/ValuationOutcomeBlock.tsx
// STRATFIT — Layer 1: Enterprise Value Outcome Block
// Probabilistic EV display with distribution curve, range, confidence, volatility.
// No new simulation runs. All metrics derived from existing calculation outputs.

import { useMemo } from "react";
import styles from "./ValuationPage.module.css";

interface ValuationOutcomeBlockProps {
  valuation: number;
  lowValuation: number;
  highValuation: number;
  confidence: number; // 0–100
  volatility: "Low" | "Medium" | "High";
}

const fmt = (v: number): string => {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
};

export default function ValuationOutcomeBlock({
  valuation,
  lowValuation,
  highValuation,
  confidence,
  volatility,
}: ValuationOutcomeBlockProps) {
  // Generate bell curve points for the distribution visualization
  const curvePath = useMemo(() => {
    const w = 480;
    const h = 80;
    const mid = w / 2;
    const sigma = w * 0.18; // controls spread

    const pts: string[] = [];
    for (let x = 0; x <= w; x += 4) {
      const z = (x - mid) / sigma;
      const y = h - h * 0.92 * Math.exp(-0.5 * z * z);
      pts.push(`${x === 0 ? "M" : "L"}${x},${y.toFixed(1)}`);
    }
    return pts.join(" ");
  }, []);

  // Marker positions on bell curve (normalized 0–1)
  const markerPositions = useMemo(() => {
    const range = highValuation - lowValuation;
    if (range <= 0) return { p10: 0.15, median: 0.5, p90: 0.85 };
    const median = (valuation - lowValuation) / range;
    return { p10: 0.12, median: Math.max(0.15, Math.min(0.85, median)), p90: 0.88 };
  }, [valuation, lowValuation, highValuation]);

  return (
    <div className={styles.outcomeBlock}>
      <div className={styles.outcomeLabel}>Estimated Enterprise Value</div>
      <div className={styles.outcomeValue}>{fmt(valuation)}</div>

      <div className={styles.outcomeSubRow}>
        <div className={styles.outcomeSub}>
          <span className={styles.outcomeSubLabel}>Range:</span>
          <span className={styles.outcomeSubValue}>
            {fmt(lowValuation)} – {fmt(highValuation)}
          </span>
        </div>
        <div className={styles.outcomeSep} />
        <div className={styles.outcomeSub}>
          <span className={styles.outcomeSubLabel}>Confidence:</span>
          <span className={styles.outcomeSubValue}>{confidence}%</span>
        </div>
        <div className={styles.outcomeSep} />
        <div className={styles.outcomeSub}>
          <span className={styles.outcomeSubLabel}>Volatility:</span>
          <span className={styles.outcomeSubValueMuted}>{volatility}</span>
        </div>
      </div>

      {/* Distribution bell curve */}
      <div className={styles.distributionWrap}>
        <svg
          className={styles.distributionSvg}
          viewBox="0 0 480 100"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Fill under curve */}
          <path
            d={`${curvePath} L480,80 L0,80 Z`}
            fill="rgba(0,224,255,0.06)"
          />
          {/* Curve stroke */}
          <path d={curvePath} fill="none" stroke="#00E0FF" strokeWidth="1.5" />

          {/* p10 marker */}
          <line
            x1={markerPositions.p10 * 480}
            y1={10}
            x2={markerPositions.p10 * 480}
            y2={80}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
            strokeDasharray="3,3"
          />
          <text
            x={markerPositions.p10 * 480}
            y={96}
            textAnchor="middle"
            fill="rgba(255,255,255,0.35)"
            fontSize="9"
            fontFamily="JetBrains Mono, monospace"
          >
            P10
          </text>

          {/* Median marker */}
          <line
            x1={markerPositions.median * 480}
            y1={0}
            x2={markerPositions.median * 480}
            y2={80}
            stroke="#00E0FF"
            strokeWidth="1.5"
            opacity={0.6}
          />
          <text
            x={markerPositions.median * 480}
            y={96}
            textAnchor="middle"
            fill="#00E0FF"
            fontSize="9"
            fontFamily="JetBrains Mono, monospace"
          >
            MEDIAN
          </text>

          {/* p90 marker */}
          <line
            x1={markerPositions.p90 * 480}
            y1={10}
            x2={markerPositions.p90 * 480}
            y2={80}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
            strokeDasharray="3,3"
          />
          <text
            x={markerPositions.p90 * 480}
            y={96}
            textAnchor="middle"
            fill="rgba(255,255,255,0.35)"
            fontSize="9"
            fontFamily="JetBrains Mono, monospace"
          >
            P90
          </text>
        </svg>
      </div>
    </div>
  );
}





