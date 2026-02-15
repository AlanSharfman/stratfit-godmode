// src/components/Risk/RiskRadar.tsx
// STRATFIT — Dual-Layer Radar (Baseline outline + Scenario fill)
// Includes: velocity micro-arrows, controllability tags, interaction lines
// No new simulation runs. Derived from existing risk factors.

import React, { useMemo } from "react";
import styles from "./RiskPage.module.css";
import type { RiskFactor, ThreatCategory } from "@/state/riskStore";

// ── Controllability mapping ──────────────────────────────────────────
const CONTROLLABILITY: Record<ThreatCategory, "controllable" | "partial" | "external"> = {
  execution: "controllable",
  runway: "controllable",
  churn: "partial",
  funding: "partial",
  market: "external",
  competition: "external",
};

const CTRL_LABELS: Record<string, string> = {
  controllable: "CONTROLLABLE",
  partial: "PARTIALLY",
  external: "EXTERNAL",
};

// ── Interaction thresholds ───────────────────────────────────────────
const INTERACTIONS: [ThreatCategory, ThreatCategory][] = [
  ["market", "funding"],
  ["execution", "churn"],
  ["runway", "funding"],
  ["market", "competition"],
];

interface RiskRadarProps {
  factors: RiskFactor[];
  baselineFactors: RiskFactor[] | null;
}

const RiskRadar: React.FC<RiskRadarProps> = ({ factors, baselineFactors }) => {
  const size = 420;
  const center = size / 2;
  const maxRadius = 155;
  const levels = 5;

  const CATEGORIES: ThreatCategory[] = ["runway", "market", "execution", "competition", "funding", "churn"];

  // Sort factors to match canonical order
  const orderedFactors = useMemo(() => {
    return CATEGORIES.map((cat) => factors.find((f) => f.category === cat)!).filter(Boolean);
  }, [factors]);

  const orderedBaseline = useMemo(() => {
    if (!baselineFactors) return null;
    return CATEGORIES.map((cat) => baselineFactors.find((f) => f.category === cat)!).filter(Boolean);
  }, [baselineFactors]);

  // Compute polygon points
  const angleStep = (2 * Math.PI) / CATEGORIES.length;
  const getPoint = (score: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const radius = (score / 100) * maxRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  const getLabelPoint = (index: number, offset: number = 0) => {
    const angle = index * angleStep - Math.PI / 2;
    const radius = maxRadius + 28 + offset;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  // Scenario polygon
  const scenarioPath = useMemo(() => {
    return orderedFactors
      .map((f, i) => {
        const p = getPoint(f.score, i);
        return `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`;
      })
      .join(" ") + " Z";
  }, [orderedFactors]);

  // Baseline polygon
  const baselinePath = useMemo(() => {
    if (!orderedBaseline) return null;
    return orderedBaseline
      .map((f, i) => {
        const p = getPoint(f.score, i);
        return `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`;
      })
      .join(" ") + " Z";
  }, [orderedBaseline]);

  // Get fill color based on overall risk
  const avgScore = useMemo(
    () => orderedFactors.reduce((sum, f) => sum + f.score, 0) / orderedFactors.length,
    [orderedFactors]
  );

  const fillColor = avgScore <= 35 ? "rgba(0, 224, 255, 0.08)" : avgScore <= 55 ? "rgba(251, 191, 36, 0.1)" : "rgba(255, 77, 77, 0.1)";
  const strokeColor = avgScore <= 35 ? "#00E0FF" : avgScore <= 55 ? "#fbbf24" : "#FF4D4D";

  // Velocity (baseline vs scenario)
  const velocities = useMemo(() => {
    if (!orderedBaseline) return orderedFactors.map(() => "stable" as const);
    return orderedFactors.map((f, i) => {
      const diff = f.score - (orderedBaseline[i]?.score ?? f.score);
      if (diff > 5) return "up" as const;
      if (diff < -5) return "down" as const;
      return "stable" as const;
    });
  }, [orderedFactors, orderedBaseline]);

  // Interaction lines (only when both risks above 40)
  const activeInteractions = useMemo(() => {
    return INTERACTIONS.filter(([a, b]) => {
      const fa = orderedFactors.find((f) => f.category === a);
      const fb = orderedFactors.find((f) => f.category === b);
      return fa && fb && fa.score > 40 && fb.score > 40;
    }).map(([a, b]) => {
      const ai = CATEGORIES.indexOf(a);
      const bi = CATEGORIES.indexOf(b);
      const pa = getPoint(orderedFactors[ai]?.score ?? 50, ai);
      const pb = getPoint(orderedFactors[bi]?.score ?? 50, bi);
      return { x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y };
    });
  }, [orderedFactors]);

  // Grid
  const gridCircles = Array.from({ length: levels }, (_, i) => ({
    radius: ((i + 1) / levels) * maxRadius,
    value: Math.round(((i + 1) / levels) * 100),
  }));

  const axisLines = CATEGORIES.map((_, i) => {
    const angle = i * angleStep - Math.PI / 2;
    return {
      x2: center + maxRadius * Math.cos(angle),
      y2: center + maxRadius * Math.sin(angle),
    };
  });

  const getScoreColor = (score: number) => {
    if (score <= 30) return "#00E0FF";
    if (score <= 50) return "#fbbf24";
    if (score <= 70) return "#f97316";
    return "#FF4D4D";
  };

  return (
    <div>
      <div className={styles.radarContainer}>
        <svg width={size} height={size} className={styles.radarSvg}>
          {/* Grid circles */}
          {gridCircles.map((c, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={c.radius}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.5"
            />
          ))}

          {/* Axis lines */}
          {axisLines.map((l, i) => (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={l.x2}
              y2={l.y2}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.5"
            />
          ))}

          {/* Interaction lines */}
          {activeInteractions.map((line, i) => (
            <line
              key={`int-${i}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="rgba(255, 77, 77, 0.15)"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
          ))}

          {/* Baseline polygon (thin neutral outline) */}
          {baselinePath && (
            <path
              d={baselinePath}
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
              strokeDasharray="4,3"
            />
          )}

          {/* Scenario polygon (colored fill) */}
          <path
            d={scenarioPath}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="1.5"
          />

          {/* Data points + velocity arrows + labels */}
          {orderedFactors.map((f, i) => {
            const p = getPoint(f.score, i);
            const lp = getLabelPoint(i);
            const ctrlLp = getLabelPoint(i, 12);
            const vel = velocities[i];
            const ctrl = CONTROLLABILITY[f.category];
            const ctrlClass =
              ctrl === "controllable" ? styles.ctrlControllable : ctrl === "partial" ? styles.ctrlPartial : styles.ctrlExternal;

            return (
              <g key={f.category}>
                {/* Point */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill={getScoreColor(f.score)}
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1"
                />

                {/* Score near point */}
                <text
                  x={p.x}
                  y={p.y - 9}
                  fill={getScoreColor(f.score)}
                  fontSize="10"
                  fontWeight="700"
                  textAnchor="middle"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {f.score}
                </text>

                {/* Velocity micro-arrow */}
                <text
                  x={p.x + 10}
                  y={p.y + 4}
                  className={`${styles.velocityArrow} ${
                    vel === "up" ? styles.velocityUp : vel === "down" ? styles.velocityDown : styles.velocityStable
                  }`}
                  textAnchor="start"
                  fontSize="9"
                >
                  {vel === "up" ? "↑" : vel === "down" ? "↓" : "→"}
                </text>

                {/* Category label */}
                <text
                  x={lp.x}
                  y={lp.y}
                  fill="rgba(255,255,255,0.65)"
                  fontSize="10"
                  fontWeight="600"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  letterSpacing="0.04em"
                >
                  {f.label.replace(" Risk", "").toUpperCase()}
                </text>

                {/* Controllability tag as SVG text */}
                <foreignObject
                  x={ctrlLp.x - 30}
                  y={ctrlLp.y + 2}
                  width="60"
                  height="16"
                >
                  <span className={`${styles.ctrlTag} ${ctrlClass}`}>
                    {CTRL_LABELS[ctrl]}
                  </span>
                </foreignObject>
              </g>
            );
          })}

          {/* Center dot */}
          <circle cx={center} cy={center} r="2" fill="rgba(0,224,255,0.3)" />
        </svg>
      </div>

      {/* Legend */}
      <div className={styles.radarLegend}>
        <div className={styles.legendItem}>
          <span className={styles.legendLine} style={{ borderColor: "rgba(255,255,255,0.25)" }} />
          <span>Baseline</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: strokeColor }} />
          <span>Current Scenario</span>
        </div>
      </div>

      {/* Interaction note */}
      {activeInteractions.length > 0 && (
        <div className={styles.interactionNote}>
          {activeInteractions.length} correlated risk interaction{activeInteractions.length > 1 ? "s" : ""} detected
        </div>
      )}
    </div>
  );
};

export default RiskRadar;





