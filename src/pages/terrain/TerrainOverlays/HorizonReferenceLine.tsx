// src/pages/terrain/TerrainOverlays/HorizonReferenceLine.tsx
// STRATFIT — Horizon Reference Line
// A thin horizontal line across the mountain at the "baseline" level.
// Shows where the neutral/break-even threshold sits.
// Institutional. Subtle. No glow. No animation.

import React from "react";

interface HorizonReferenceLineProps {
  enabled: boolean;
  /** Survival probability 0–100 — determines where the horizon sits */
  survivalPct: number;
  /** Runway in months — secondary positioning factor */
  runway: number;
}

/**
 * Renders a thin horizontal reference line across the mountain.
 * The line position reflects the "sustainability threshold" —
 * the level at which the company maintains viability.
 *
 * Higher survival = line sits lower (more of the mountain is above it).
 * Lower survival = line sits higher (less of the mountain is above it).
 */
const HorizonReferenceLine: React.FC<HorizonReferenceLineProps> = ({
  enabled,
  survivalPct,
  runway,
}) => {
  if (!enabled) return null;

  // Horizon Y position: maps survival probability to screen position
  // High survival (80%+) → horizon at ~65% from top (most mountain visible)
  // Low survival (<40%) → horizon at ~40% from top (mountain barely clears)
  const horizonY = 70 - (survivalPct / 100) * 30; // Range: 40–70%

  // Runway label position
  const labelText = runway > 0 ? `${runway}mo horizon` : "Horizon";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      {/* SVG horizon line */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        {/* Dashed reference line */}
        <line
          x1="3"
          y1={horizonY}
          x2="97"
          y2={horizonY}
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="0.3"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="6 4"
        />
      </svg>

      {/* Left label */}
      <div
        style={{
          position: "absolute",
          left: 12,
          top: `${horizonY}%`,
          transform: "translateY(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 8,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(255, 255, 255, 0.2)",
            fontFamily: "'Inter', sans-serif",
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
            whiteSpace: "nowrap",
          }}
        >
          {labelText}
        </span>
      </div>

      {/* Right survival label */}
      <div
        style={{
          position: "absolute",
          right: 12,
          top: `${horizonY}%`,
          transform: "translateY(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <span
          style={{
            fontSize: 8,
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: "rgba(255, 255, 255, 0.2)",
            fontFamily: "'JetBrains Mono', monospace",
            textShadow: "0 1px 4px rgba(0,0,0,0.8)",
            whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {survivalPct}% survival
        </span>
      </div>
    </div>
  );
};

export default HorizonReferenceLine;






