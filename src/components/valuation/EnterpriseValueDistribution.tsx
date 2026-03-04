// src/components/valuation/EnterpriseValueDistribution.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Enterprise Value Distribution Chart (Phase V-3A)
//
// Pure SVG visualisation of EV distribution across valuation methods.
// Derives synthetic percentile bands (p10→p90) from the three method EVs
// (DCF, Revenue Multiple, EBITDA Multiple) and the blended value.
//
// No charting library. No UI-side valuation math — formatting only.
// Reads from ValuationResults output of selectValuationFromSimulation.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from "react";
import type { ValuationResults } from "@/valuation/valuationTypes";
import styles from "./EnterpriseValueDistribution.module.css";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface PercentilePoint {
  label: string;
  pctLabel: string;
  value: number;
  description: string;
  color: string;
}

interface Props {
  valuation: ValuationResults;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const SVG_WIDTH = 560;
const SVG_HEIGHT = 200;
const CHART_LEFT = 40;
const CHART_RIGHT = 520;
const CHART_WIDTH = CHART_RIGHT - CHART_LEFT;
const CURVE_TOP = 30;
const CURVE_BOTTOM = 140;
const LABEL_Y = 165;
const VALUE_Y = 180;

const COLORS = {
  p10: "rgba(239, 68, 68, 0.7)",    // red — downside
  p25: "rgba(251, 191, 36, 0.7)",   // amber
  p50: "rgba(34, 211, 238, 1)",     // cyan — central
  p75: "rgba(52, 211, 153, 0.7)",   // emerald
  p90: "rgba(96, 165, 250, 0.7)",   // blue — upside
};

// ═══════════════════════════════════════════════════════════════════════════
// FORMATTING — zero computation
// ═══════════════════════════════════════════════════════════════════════════

function fmtEV(v: number): string {
  if (!isFinite(v) || v === 0) return "$0";
  if (Math.abs(v) >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// DISTRIBUTION CURVE — synthetic bell shape
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate smooth bell-curve path points.
 * Gaussian-like shape centred on 0.5, scaled to chart dimensions.
 */
function buildCurvePath(steps: number = 80): string {
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = CHART_LEFT + t * CHART_WIDTH;
    // Gaussian: exp(-((t - 0.5)^2) / (2 * sigma^2))
    const sigma = 0.18;
    const gauss = Math.exp(-Math.pow(t - 0.5, 2) / (2 * sigma * sigma));
    const y = CURVE_BOTTOM - gauss * (CURVE_BOTTOM - CURVE_TOP);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  // Close path along bottom
  return `M${CHART_LEFT},${CURVE_BOTTOM} L${points.join(" L")} L${CHART_RIGHT},${CURVE_BOTTOM} Z`;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function EnterpriseValueDistribution({ valuation }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // ── Derive percentile points from method EVs ──
  const percentiles: PercentilePoint[] = useMemo(() => {
    const dcfEV = valuation.dcf.enterpriseValue;
    const revEV = valuation.revenueMultiple.enterpriseValue;
    const ebitdaEV = valuation.ebitdaMultiple.enterpriseValue;
    const blended = valuation.blendedValue;

    const sorted = [dcfEV, revEV, ebitdaEV].sort((a, b) => a - b);
    const low = sorted[0];
    const high = sorted[sorted.length - 1];

    return [
      {
        label: "P10",
        pctLabel: "10th",
        value: low,
        description: "10% of outcomes fall below this value",
        color: COLORS.p10,
      },
      {
        label: "P25",
        pctLabel: "25th",
        value: low + (blended - low) * 0.5,
        description: "25% of outcomes fall below this value",
        color: COLORS.p25,
      },
      {
        label: "P50",
        pctLabel: "50th",
        value: blended,
        description: "Median — blended enterprise value",
        color: COLORS.p50,
      },
      {
        label: "P75",
        pctLabel: "75th",
        value: blended + (high - blended) * 0.5,
        description: "75% of outcomes fall below this value",
        color: COLORS.p75,
      },
      {
        label: "P90",
        pctLabel: "90th",
        value: high,
        description: "90% of outcomes fall below this value",
        color: COLORS.p90,
      },
    ];
  }, [valuation]);

  // ── X-axis mapping ──
  const xRange = useMemo(() => {
    const values = percentiles.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    // Add 15% padding on each side
    const pad = Math.max((max - min) * 0.15, Math.abs(min) * 0.05 || 1);
    return { min: min - pad, max: max + pad };
  }, [percentiles]);

  const toX = useCallback(
    (v: number) => {
      const range = xRange.max - xRange.min;
      if (range === 0) return CHART_LEFT + CHART_WIDTH / 2;
      return CHART_LEFT + ((v - xRange.min) / range) * CHART_WIDTH;
    },
    [xRange],
  );

  // ── Bell curve path ──
  const curvePath = useMemo(() => buildCurvePath(), []);

  // ── Curve height at a given x (for marker top positioning) ──
  const curveYAtX = useCallback(
    (xPos: number) => {
      const t = (xPos - CHART_LEFT) / CHART_WIDTH;
      const sigma = 0.18;
      const gauss = Math.exp(-Math.pow(t - 0.5, 2) / (2 * sigma * sigma));
      return CURVE_BOTTOM - gauss * (CURVE_BOTTOM - CURVE_TOP);
    },
    [],
  );

  return (
    <div className={styles.chartContainer}>
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className={styles.svg}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Gradient fill for distribution curve */}
          <linearGradient id="ev-dist-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(34, 211, 238, 0.25)" />
            <stop offset="100%" stopColor="rgba(34, 211, 238, 0.02)" />
          </linearGradient>

          {/* Glow filter for P50 marker */}
          <filter id="ev-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Baseline axis ── */}
        <line
          x1={CHART_LEFT}
          y1={CURVE_BOTTOM}
          x2={CHART_RIGHT}
          y2={CURVE_BOTTOM}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />

        {/* ── Distribution curve fill ── */}
        <path
          d={curvePath}
          fill="url(#ev-dist-grad)"
          stroke="rgba(34, 211, 238, 0.35)"
          strokeWidth="1.5"
        />

        {/* ── Percentile markers ── */}
        {percentiles.map((p, i) => {
          const x = toX(p.value);
          const markerTop = curveYAtX(x);
          const isHovered = hoveredIdx === i;
          const isP50 = p.label === "P50";

          return (
            <g
              key={p.label}
              className={styles.markerGroup}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Vertical marker line */}
              <line
                x1={x}
                y1={markerTop}
                x2={x}
                y2={CURVE_BOTTOM}
                stroke={p.color}
                strokeWidth={isP50 ? 2 : 1.5}
                strokeDasharray={isP50 ? "none" : "4 3"}
                opacity={isHovered ? 1 : 0.7}
                filter={isP50 ? "url(#ev-glow)" : undefined}
              />

              {/* Diamond marker at curve intersection */}
              <polygon
                points={`${x},${markerTop - 5} ${x + 4},${markerTop} ${x},${markerTop + 5} ${x - 4},${markerTop}`}
                fill={p.color}
                opacity={isHovered ? 1 : 0.8}
              />

              {/* Invisible hit area for hover */}
              <rect
                x={x - 18}
                y={markerTop - 10}
                width={36}
                height={CURVE_BOTTOM - markerTop + 50}
                fill="transparent"
                style={{ cursor: "pointer" }}
              />

              {/* Label below axis */}
              <text
                x={x}
                y={LABEL_Y}
                textAnchor="middle"
                className={styles.markerLabel}
                fill={isHovered ? p.color : "rgba(255,255,255,0.45)"}
                fontSize="10"
                fontWeight={isP50 ? 600 : 400}
              >
                {p.label}
              </text>

              {/* Value below label */}
              <text
                x={x}
                y={VALUE_Y}
                textAnchor="middle"
                className={styles.markerValue}
                fill={isHovered ? "#fff" : "rgba(255,255,255,0.3)"}
                fontSize="10"
                fontFamily="'JetBrains Mono', monospace"
              >
                {fmtEV(p.value)}
              </text>

              {/* ── Tooltip (shown on hover) ── */}
              {isHovered && (
                <g>
                  <rect
                    x={Math.min(Math.max(x - 80, 2), SVG_WIDTH - 162)}
                    y={markerTop - 52}
                    width={160}
                    height={42}
                    rx={6}
                    fill="rgba(15, 23, 42, 0.95)"
                    stroke={p.color}
                    strokeWidth={1}
                  />
                  <text
                    x={Math.min(Math.max(x, 82), SVG_WIDTH - 82)}
                    y={markerTop - 35}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize="11"
                    fontWeight={600}
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    {`${p.pctLabel} percentile: ${fmtEV(p.value)}`}
                  </text>
                  <text
                    x={Math.min(Math.max(x, 82), SVG_WIDTH - 82)}
                    y={markerTop - 18}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.5)"
                    fontSize="9"
                  >
                    {p.description}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* ── Method legend ── */}
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: COLORS.p10 }} />
          P10 — Conservative floor
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: COLORS.p50 }} />
          P50 — Blended EV
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: COLORS.p90 }} />
          P90 — Upside ceiling
        </span>
      </div>
    </div>
  );
}
