// src/components/valuation/ValuationOutcomeBlock.tsx
// STRATFIT — Layer 1: Probability-First Enterprise Value Display
// Headline: p50 (median EV).
// Default range: p25–p75 ("Operating range").
// Stress range: p10–p90 (collapsible).
// Probability panel: P(EV ≥ X), P(EV ≤ Y).
// Distribution curve with percentile markers.

import { useState, useMemo } from "react";
import styles from "./ValuationPage.module.css";
import type { ValuationDistributionSummary } from "@/logic/valuation/summarizeValuationDistribution";

interface ValuationOutcomeBlockProps {
  dist: ValuationDistributionSummary;
  confidence: number; // 0–100
  volatility: "Low" | "Medium" | "High";
  multiple: number;
}

const fmt = (v: number): string => {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
};

const pctFmt = (p: number): string => {
  if (p >= 0.995) return ">99%";
  if (p <= 0.005) return "<1%";
  return `${Math.round(p * 100)}%`;
};

export default function ValuationOutcomeBlock({
  dist,
  confidence,
  volatility,
  multiple,
}: ValuationOutcomeBlockProps) {
  const [showStress, setShowStress] = useState(false);

  // Generate bell curve from distribution shape
  const curvePath = useMemo(() => {
    const w = 480;
    const h = 80;
    // Skew the curve based on p25/p50/p75 positioning
    const range = dist.p90 - dist.p10;
    if (range <= 0) {
      // Flat line fallback
      return `M0,${h} L${w},${h}`;
    }
    const mid = w / 2;
    const sigma = w * 0.20;

    const pts: string[] = [];
    for (let x = 0; x <= w; x += 4) {
      const z = (x - mid) / sigma;
      const y = h - h * 0.9 * Math.exp(-0.5 * z * z);
      pts.push(`${x === 0 ? "M" : "L"}${x},${y.toFixed(1)}`);
    }
    return pts.join(" ");
  }, [dist]);

  // Marker X positions on SVG (480 wide)
  const markers = useMemo(() => {
    const range = dist.p90 - dist.p10;
    if (range <= 0) return { p10: 48, p25: 120, p50: 240, p75: 360, p90: 432 };
    const toX = (v: number) => Math.max(20, Math.min(460, ((v - dist.p10) / range) * 400 + 40));
    return {
      p10: toX(dist.p10),
      p25: toX(dist.p25),
      p50: toX(dist.p50),
      p75: toX(dist.p75),
      p90: toX(dist.p90),
    };
  }, [dist]);

  const insufficientData = dist.p50 <= 0;

  if (insufficientData) {
    return (
      <div className={styles.outcomeBlock}>
        <div className={styles.outcomeLabel}>ENTERPRISE VALUE ESTIMATE</div>
        <div className={styles.outcomeValue} style={{ fontSize: 28, opacity: 0.5 }}>
          Insufficient simulation data
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          Run a simulation to generate a valuation distribution.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.outcomeBlock}>
      {/* ── Label ── */}
      <div className={styles.outcomeLabel}>MEDIAN ENTERPRISE VALUE (P50)</div>

      {/* ── Headline: p50 ── */}
      <div className={styles.outcomeValue}>{fmt(dist.p50)}</div>

      {/* ── Operating Range (p25–p75) ── */}
      <div className={styles.outcomeSubRow}>
        <div className={styles.outcomeSub}>
          <span className={styles.outcomeSubLabel}>Operating range:</span>
          <span className={styles.outcomeSubValue}>
            {fmt(dist.p25)} – {fmt(dist.p75)}
          </span>
        </div>
        <div className={styles.outcomeSep} />
        <div className={styles.outcomeSub}>
          <span className={styles.outcomeSubLabel}>Multiple:</span>
          <span className={styles.outcomeSubValue}>{multiple.toFixed(1)}×</span>
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

      {/* ── Collapsible Stress Range (p10–p90) ── */}
      <div className={styles.stressToggle}>
        <button
          className={styles.stressToggleBtn}
          onClick={() => setShowStress(!showStress)}
          aria-expanded={showStress}
        >
          <span>Stress range (P10–P90)</span>
          <span className={`${styles.stressChevron} ${showStress ? styles.stressChevronOpen : ""}`}>
            ▾
          </span>
        </button>
        {showStress && (
          <div className={styles.stressContent}>
            <div className={styles.stressRow}>
              <span className={styles.stressLabel}>P10 (downside)</span>
              <span className={styles.stressValue} style={{ color: "#ef4444" }}>
                {fmt(dist.p10)}
              </span>
            </div>
            <div className={styles.stressRow}>
              <span className={styles.stressLabel}>P90 (upside)</span>
              <span className={styles.stressValue} style={{ color: "#10b981" }}>
                {fmt(dist.p90)}
              </span>
            </div>
            <div className={styles.stressRow}>
              <span className={styles.stressLabel}>Winsorised display</span>
              <span className={styles.stressValueMuted}>
                {fmt(dist.winsorLow)} – {fmt(dist.winsorHigh)}
              </span>
            </div>
            {!dist.isFromRealDistribution && (
              <div className={styles.stressNote}>
                ⓘ Range derived from synthetic uncertainty model. Run a simulation for empirical bands.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Distribution Curve ── */}
      <div className={styles.distributionWrap}>
        <svg
          className={styles.distributionSvg}
          viewBox="0 0 480 100"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Operating range fill (p25–p75) */}
          <rect
            x={markers.p25}
            y={4}
            width={markers.p75 - markers.p25}
            height={76}
            fill="rgba(0,224,255,0.06)"
            rx={3}
          />

          {/* Stress range fill (p10–p90) — lighter */}
          <rect
            x={markers.p10}
            y={4}
            width={markers.p90 - markers.p10}
            height={76}
            fill="rgba(255,255,255,0.02)"
            rx={3}
          />

          {/* Curve stroke + fill */}
          <path d={`${curvePath} L480,80 L0,80 Z`} fill="rgba(0,224,255,0.04)" />
          <path d={curvePath} fill="none" stroke="#00E0FF" strokeWidth="1.5" opacity={0.6} />

          {/* P10 marker */}
          <line
            x1={markers.p10} y1={8} x2={markers.p10} y2={80}
            stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3,3"
          />
          <text x={markers.p10} y={96} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="JetBrains Mono, monospace">
            P10
          </text>

          {/* P25 marker */}
          <line
            x1={markers.p25} y1={8} x2={markers.p25} y2={80}
            stroke="rgba(0,224,255,0.25)" strokeWidth="1" strokeDasharray="2,2"
          />
          <text x={markers.p25} y={96} textAnchor="middle" fill="rgba(0,224,255,0.45)" fontSize="8" fontFamily="JetBrains Mono, monospace">
            P25
          </text>

          {/* P50 (MEDIAN) marker — prominent */}
          <line
            x1={markers.p50} y1={0} x2={markers.p50} y2={80}
            stroke="#00E0FF" strokeWidth="2" opacity={0.8}
          />
          <text x={markers.p50} y={96} textAnchor="middle" fill="#00E0FF" fontSize="9" fontWeight="600" fontFamily="JetBrains Mono, monospace">
            MEDIAN
          </text>

          {/* P75 marker */}
          <line
            x1={markers.p75} y1={8} x2={markers.p75} y2={80}
            stroke="rgba(0,224,255,0.25)" strokeWidth="1" strokeDasharray="2,2"
          />
          <text x={markers.p75} y={96} textAnchor="middle" fill="rgba(0,224,255,0.45)" fontSize="8" fontFamily="JetBrains Mono, monospace">
            P75
          </text>

          {/* P90 marker */}
          <line
            x1={markers.p90} y1={8} x2={markers.p90} y2={80}
            stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3,3"
          />
          <text x={markers.p90} y={96} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="JetBrains Mono, monospace">
            P90
          </text>
        </svg>
      </div>

      {/* ── Probability Panel ── */}
      {dist.probabilities.length > 0 && (
        <div className={styles.probabilityPanel}>
          <div className={styles.probabilityTitle}>PROBABILITY THRESHOLDS</div>
          <div className={styles.probabilityGrid}>
            {dist.probabilities.map((p, i) => (
              <div key={i} className={styles.probabilityItem}>
                <span className={styles.probabilityLabel}>{p.label}</span>
                <span
                  className={styles.probabilityValue}
                  style={{
                    color:
                      p.direction === "ge"
                        ? p.probability > 0.6
                          ? "#10b981"
                          : p.probability > 0.3
                            ? "#00E0FF"
                            : "rgba(255,255,255,0.5)"
                        : p.probability < 0.15
                          ? "#10b981"
                          : p.probability < 0.3
                            ? "#00E0FF"
                            : "#ef4444",
                  }}
                >
                  {pctFmt(p.probability)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Source badge ── */}
      <div className={styles.sourceBadge}>
        {dist.isFromRealDistribution
          ? `Based on ${dist.sampleCount.toLocaleString()} Monte Carlo paths`
          : "Synthetic uncertainty model · run simulation for empirical distribution"}
      </div>
    </div>
  );
}
