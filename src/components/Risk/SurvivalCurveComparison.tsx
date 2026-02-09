// src/components/Risk/SurvivalCurveComparison.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Survival Curve Comparison (Baseline vs Shock Overlay)
//
// Dual survival curves (SVG). Shows:
//   • Baseline survival by month (cyan)
//   • Shocked survival by month (red dashed)
//   • p50 survival markers
//   • Delta %
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import styles from "./SurvivalCurveComparison.module.css";

// ── Props ────────────────────────────────────────────────────────────

interface SurvivalCurveComparisonProps {
  baselineSurvivalByMonth: number[];
  shockedSurvivalByMonth: number[];
  baselineSurvivalRate: number;
  shockedSurvivalRate: number;
  timeHorizonMonths: number;
  isComputing?: boolean;
}

// ── Component ────────────────────────────────────────────────────────

export const SurvivalCurveComparison: React.FC<SurvivalCurveComparisonProps> = ({
  baselineSurvivalByMonth,
  shockedSurvivalByMonth,
  baselineSurvivalRate,
  shockedSurvivalRate,
  timeHorizonMonths,
  isComputing = false,
}) => {
  const W = 480;
  const H = 220;
  const PAD_L = 42;
  const PAD_R = 16;
  const PAD_T = 20;
  const PAD_B = 28;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const toX = (month: number) => PAD_L + (month / Math.max(timeHorizonMonths - 1, 1)) * plotW;
  const toY = (rate: number) => PAD_T + (1 - rate) * plotH;

  const baselinePath = useMemo(() => {
    if (baselineSurvivalByMonth.length === 0) return "";
    return baselineSurvivalByMonth
      .map((s, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(s).toFixed(1)}`)
      .join(" ");
  }, [baselineSurvivalByMonth, timeHorizonMonths]);

  const shockedPath = useMemo(() => {
    if (shockedSurvivalByMonth.length === 0) return "";
    return shockedSurvivalByMonth
      .map((s, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(s).toFixed(1)}`)
      .join(" ");
  }, [shockedSurvivalByMonth, timeHorizonMonths]);

  const baselineFill = useMemo(() => {
    if (!baselinePath) return "";
    const last = baselineSurvivalByMonth.length - 1;
    return `${baselinePath} L${toX(last).toFixed(1)},${toY(0).toFixed(1)} L${toX(0).toFixed(1)},${toY(0).toFixed(1)} Z`;
  }, [baselinePath, baselineSurvivalByMonth]);

  const shockedFill = useMemo(() => {
    if (!shockedPath) return "";
    const last = shockedSurvivalByMonth.length - 1;
    return `${shockedPath} L${toX(last).toFixed(1)},${toY(0).toFixed(1)} L${toX(0).toFixed(1)},${toY(0).toFixed(1)} Z`;
  }, [shockedPath, shockedSurvivalByMonth]);

  const deltaPP = (shockedSurvivalRate - baselineSurvivalRate) * 100;

  // Y grid lines
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0];
  // X axis labels
  const xLabels = [0, 6, 12, 18, 24, 30, 36].filter((m) => m <= timeHorizonMonths);

  return (
    <div className={styles.root}>
      <div className={styles.title}>Survival Distribution</div>

      {isComputing && (
        <div className={styles.computing}>Recomputing shock scenario…</div>
      )}

      <svg
        className={styles.svg}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Y axis grid + labels */}
        {yTicks.map((v) => {
          const y = toY(v);
          return (
            <g key={v}>
              <line
                x1={PAD_L}
                y1={y}
                x2={W - PAD_R}
                y2={y}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="0.5"
              />
              <text
                x={PAD_L - 6}
                y={y + 3}
                textAnchor="end"
                fill="rgba(255,255,255,0.2)"
                fontSize="9"
                fontFamily="'JetBrains Mono', monospace"
              >
                {(v * 100).toFixed(0)}%
              </text>
            </g>
          );
        })}

        {/* X axis labels */}
        {xLabels.map((m) => {
          const x = toX(m);
          return (
            <text
              key={m}
              x={x}
              y={H - 6}
              textAnchor="middle"
              fill="rgba(255,255,255,0.2)"
              fontSize="9"
              fontFamily="'JetBrains Mono', monospace"
            >
              {m}mo
            </text>
          );
        })}

        {/* p50 reference line */}
        <line
          x1={PAD_L}
          y1={toY(0.5)}
          x2={W - PAD_R}
          y2={toY(0.5)}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.5"
          strokeDasharray="3,4"
        />

        {/* Baseline fill */}
        {baselineFill && (
          <path d={baselineFill} fill="rgba(0,224,255,0.05)" />
        )}

        {/* Shocked fill */}
        {shockedFill && (
          <path d={shockedFill} fill="rgba(239,68,68,0.05)" />
        )}

        {/* Baseline curve */}
        {baselinePath && (
          <path
            d={baselinePath}
            fill="none"
            stroke="#00E0FF"
            strokeWidth="1.5"
            opacity="0.85"
          />
        )}

        {/* Shocked curve */}
        {shockedPath && (
          <path
            d={shockedPath}
            fill="none"
            stroke="#ef4444"
            strokeWidth="1.5"
            opacity="0.8"
            strokeDasharray="5,3"
          />
        )}
      </svg>

      {/* Metrics strip */}
      <div className={styles.metricsStrip}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Baseline Survival</span>
          <span className={styles.metricValue} style={{ color: "#00E0FF" }}>
            {(baselineSurvivalRate * 100).toFixed(1)}%
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Shocked Survival</span>
          <span className={styles.metricValue} style={{ color: "#ef4444" }}>
            {(shockedSurvivalRate * 100).toFixed(1)}%
          </span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Δ Survival</span>
          <span
            className={styles.metricValue}
            style={{ color: deltaPP < 0 ? "#ef4444" : "#34d399" }}
          >
            {deltaPP >= 0 ? "+" : ""}
            {deltaPP.toFixed(1)}pp
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendSolid} />
          <span>Baseline</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDashed} />
          <span>Shocked</span>
        </div>
      </div>
    </div>
  );
};

export default SurvivalCurveComparison;

