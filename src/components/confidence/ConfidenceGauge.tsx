// src/components/confidence/ConfidenceGauge.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Grounded Confidence Gauge (5-band)
//
// Visual: horizontal 5-segment bar with label + tooltip.
// Bands: VERY_LOW | LOW | MEDIUM | HIGH | VERY_HIGH
// Palette: STRATFIT jewelled glass — cyan/ice blue, emerald positive.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import type { ConfidenceResult, ConfidenceBand } from "@/logic/confidence/modelConfidence";
import styles from "./ConfidenceGauge.module.css";

// ────────────────────────────────────────────────────────────────────────────
// BAND CONFIG
// ────────────────────────────────────────────────────────────────────────────

const BANDS: { id: ConfidenceBand; label: string; color: string }[] = [
  { id: "VERY_LOW",  label: "Very Low",  color: "#ef4444" },
  { id: "LOW",       label: "Low",       color: "#a78bfa" },
  { id: "MEDIUM",    label: "Medium",    color: "#00E0FF" },
  { id: "HIGH",      label: "High",      color: "#34d399" },
  { id: "VERY_HIGH", label: "Very High", color: "#22d3ee" },
];

function bandIndex(band: ConfidenceBand): number {
  return BANDS.findIndex((b) => b.id === band);
}

function bandColor(band: ConfidenceBand): string {
  return BANDS[bandIndex(band)]?.color ?? "#00E0FF";
}

function bandLabel(band: ConfidenceBand): string {
  return BANDS[bandIndex(band)]?.label ?? band;
}

// ────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────────────────────

interface ConfidenceGaugeProps {
  result: ConfidenceResult;
  compact?: boolean;
}

export const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({ result, compact = false }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const activeIdx = bandIndex(result.band);
  const color = bandColor(result.band);

  if (compact) {
    return (
      <div className={styles.compactRoot}>
        <div className={styles.compactBar}>
          {BANDS.map((b, i) => (
            <div
              key={b.id}
              className={`${styles.compactSegment} ${i <= activeIdx ? styles.compactSegmentActive : ""}`}
              style={i <= activeIdx ? { background: b.color, boxShadow: `0 0 6px ${b.color}40` } : undefined}
            />
          ))}
        </div>
        <span className={styles.compactLabel} style={{ color }}>
          {bandLabel(result.band)}
        </span>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* LABEL ROW */}
      <div className={styles.labelRow}>
        <span className={styles.title}>Model Confidence</span>
        <span className={styles.bandBadge} style={{ color, borderColor: `${color}40`, background: `${color}0a` }}>
          {bandLabel(result.band)}
        </span>
        <button
          className={styles.infoBtn}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => setShowTooltip((p) => !p)}
          aria-label="Show confidence details"
        >
          ?
        </button>
      </div>

      {/* 5-SEGMENT BAR */}
      <div className={styles.bar}>
        {BANDS.map((b, i) => (
          <div
            key={b.id}
            className={`${styles.segment} ${i <= activeIdx ? styles.segmentActive : ""}`}
            style={i <= activeIdx ? { background: b.color, boxShadow: `0 0 8px ${b.color}30` } : undefined}
          />
        ))}
      </div>

      {/* BAND LABELS UNDER BAR */}
      <div className={styles.bandLabels}>
        {BANDS.map((b) => (
          <span
            key={b.id}
            className={styles.bandTick}
            style={b.id === result.band ? { color: b.color, fontWeight: 600 } : undefined}
          >
            {b.label}
          </span>
        ))}
      </div>

      {/* TOOLTIP / EXPANDED REASONS */}
      {showTooltip && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipTitle}>Confidence Factors</div>
          <ul className={styles.reasonsList}>
            {result.reasons.map((r, i) => (
              <li key={i} className={styles.reasonItem}>{r}</li>
            ))}
          </ul>
          <div className={styles.metricsGrid}>
            <MetricRow label="Iterations" value={result.metrics.iterationsScore01} />
            <MetricRow label="Tightness" value={result.metrics.tightnessScore01} />
            <MetricRow label="Completeness" value={result.metrics.completenessScore01} />
            <MetricRow label="Stability" value={result.metrics.stabilityScore01} />
            {result.metrics.methodPenalty01 > 0 && (
              <MetricRow label="Blending Penalty" value={-result.metrics.methodPenalty01} negative />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Metric row for tooltip ──

function MetricRow({ label, value, negative }: { label: string; value: number; negative?: boolean }) {
  const pct = Math.round(Math.abs(value) * 100);
  const barColor = negative ? "#ef4444" : value >= 0.7 ? "#34d399" : value >= 0.4 ? "#00E0FF" : "#a78bfa";
  return (
    <div className={styles.metricRow}>
      <span className={styles.metricLabel}>{label}</span>
      <div className={styles.metricBarWrap}>
        <div className={styles.metricBar} style={{ width: `${pct}%`, background: barColor }} />
      </div>
      <span className={styles.metricValue} style={{ color: barColor }}>
        {negative ? "−" : ""}{pct}%
      </span>
    </div>
  );
}

export default ConfidenceGauge;



