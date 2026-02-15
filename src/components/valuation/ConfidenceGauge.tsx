// src/components/valuation/ConfidenceGauge.tsx
// STRATFIT — Institutional Confidence Gauge (SVG circular dial)

import React, { useState } from "react";
import type { ModelConfidenceResult } from "@/logic/confidence/calculateModelConfidence";
import styles from "./ConfidenceGauge.module.css";

// ── Color mapping ──
function getColor(score: number): string {
  if (score >= 75) return "#34d399"; // Emerald
  if (score >= 60) return "#00E0FF"; // Cyan
  if (score >= 40) return "#fbbf24"; // Amber
  return "#ef4444"; // Red
}

// ── Driver labels ──
const DRIVER_LABELS: Record<string, string> = {
  sampleAdequacy: "Sample Adequacy",
  dispersionRisk: "Dispersion Risk",
  inputIntegrity: "Input Integrity",
  crossMethodAlignment: "Cross-Method Alignment",
};

// ════════════════════════════════════════════════════════════════════════════
// FULL GAUGE (Valuation + Assessment pages)
// ════════════════════════════════════════════════════════════════════════════

interface ConfidenceGaugeProps {
  result: ModelConfidenceResult;
}

export const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({ result }) => {
  const [showWhy, setShowWhy] = useState(false);
  const { confidenceScore, classification, drivers } = result;
  const color = getColor(confidenceScore);
  const score = Math.round(confidenceScore);

  // SVG arc parameters
  const size = 120;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (circumference * 3) / 4; // 270 degrees
  const filledLength = (score / 100) * arcLength;
  const dashArray = `${filledLength} ${circumference}`;
  const rotation = 135; // start at bottom-left

  return (
    <div className={styles.gaugeRoot}>
      <div className={styles.dialWrap}>
        <svg
          className={styles.dialSvg}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
          />
          {/* Filled arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={dashArray}
            strokeLinecap="round"
            transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dasharray 400ms ease, stroke 300ms ease" }}
          />
        </svg>
        <div className={styles.dialCenter}>
          <span className={styles.dialScore} style={{ fontSize: 28, color }}>
            {score}
          </span>
          <span className={styles.dialClassification} style={{ color }}>
            {classification}
          </span>
        </div>
      </div>

      <div className={styles.gaugeLabel}>
        Model Confidence:{" "}
        <span className={styles.gaugeLabelValue} style={{ color }}>
          {score}
        </span>{" "}
        ({classification})
        {score < 40 && <span className={styles.alertIcon}>!</span>}
      </div>

      <button
        className={styles.whyToggle}
        onClick={() => setShowWhy((p) => !p)}
      >
        Why?{" "}
        <span className={`${styles.whyChevron} ${showWhy ? styles.whyChevronOpen : ""}`}>
          ▼
        </span>
      </button>

      {showWhy && (
        <div className={styles.driverPanel}>
          {(Object.keys(drivers) as (keyof typeof drivers)[]).map((key) => {
            const val = drivers[key];
            const driverColor = getColor(val);
            return (
              <div key={key} className={styles.driverRow}>
                <span className={styles.driverLabel}>{DRIVER_LABELS[key]}</span>
                <div className={styles.driverBarWrap}>
                  <div
                    className={styles.driverBar}
                    style={{ width: `${Math.round(val)}%`, background: driverColor }}
                  />
                </div>
                <span className={styles.driverValue}>{Math.round(val)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// COMPACT GAUGE (Compare page — smaller version)
// ════════════════════════════════════════════════════════════════════════════

interface CompactConfidenceGaugeProps {
  result: ModelConfidenceResult;
}

export const CompactConfidenceGauge: React.FC<CompactConfidenceGaugeProps> = ({ result }) => {
  const { confidenceScore, classification } = result;
  const score = Math.round(confidenceScore);
  const color = getColor(confidenceScore);

  const size = 64;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (circumference * 3) / 4;
  const filledLength = (score / 100) * arcLength;
  const dashArray = `${filledLength} ${circumference}`;
  const rotation = 135;

  return (
    <div className={styles.compactRoot}>
      <div className={styles.dialWrap}>
        <svg className={styles.dialSvg} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}
            strokeDasharray={`${arcLength} ${circumference}`} strokeLinecap="round"
            transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={dashArray} strokeLinecap="round"
            transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dasharray 400ms ease" }}
          />
        </svg>
        <div className={styles.dialCenter}>
          <span className={styles.dialScore} style={{ fontSize: 16, color }}>{score}</span>
        </div>
      </div>
      <span className={styles.compactLabel} style={{ color }}>
        {classification}
        {score < 40 && <span className={styles.alertIcon}>!</span>}
      </span>
    </div>
  );
};

export default ConfidenceGauge;







