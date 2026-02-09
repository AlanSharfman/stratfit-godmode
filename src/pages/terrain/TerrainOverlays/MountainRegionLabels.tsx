// src/pages/terrain/TerrainOverlays/MountainRegionLabels.tsx
// STRATFIT — Mountain Region Labels
// Permanent bottom-edge labels identifying what each zone of the mountain represents.
// Maps to the 7-vector: Revenue, Margin, Runway, Cash, Burn, Efficiency, Risk
// These match the metrics in TerrainIntelligencePanel (right column).
// Institutional. Subtle. Always visible.

import React, { useMemo } from "react";

interface MountainRegionLabelsProps {
  enabled: boolean;
  dataPoints: number[]; // 7-vector normalized 0–1
}

// The 7 mountain zones in order (left to right)
const ZONE_DEFS = [
  { key: "revenue",    label: "REVENUE",    color: "rgba(34, 211, 238, 0.55)" },
  { key: "margin",     label: "MARGIN",     color: "rgba(52, 211, 153, 0.55)" },
  { key: "runway",     label: "RUNWAY",     color: "rgba(96, 165, 250, 0.55)" },
  { key: "cash",       label: "CASH",       color: "rgba(167, 139, 250, 0.55)" },
  { key: "burn",       label: "BURN",       color: "rgba(251, 191, 36, 0.55)" },
  { key: "efficiency", label: "EFFICIENCY", color: "rgba(34, 211, 238, 0.55)" },
  { key: "risk",       label: "RISK",       color: "rgba(248, 113, 113, 0.55)" },
];

const MountainRegionLabels: React.FC<MountainRegionLabelsProps> = ({
  enabled,
  dataPoints,
}) => {
  // Interpret the data points for labeling
  const dp = useMemo(() => {
    return dataPoints.length >= 7 ? dataPoints : [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
  }, [dataPoints]);

  if (!enabled) return null;

  const padX = 10; // Match SensitivityNodes padding
  const rangeX = 100 - 2 * padX;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 3,
      }}
    >
      {/* ═══ BOTTOM ZONE LABELS ═══ */}
      <div
        style={{
          position: "absolute",
          bottom: 6,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "space-between",
          padding: `0 ${padX - 1}%`,
        }}
      >
        {ZONE_DEFS.map((zone, i) => {
          const strength = dp[i];
          // Visual indicator: subtle bar showing relative strength
          const barWidth = Math.max(4, strength * 100);
          const isWeak = strength < 0.35;
          const isStrong = strength > 0.65;

          return (
            <div
              key={zone.key}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                flex: 1,
                maxWidth: `${rangeX / 7}%`,
              }}
            >
              {/* Strength indicator bar */}
              <div
                style={{
                  width: Math.min(24, Math.max(8, barWidth * 0.24)),
                  height: 2,
                  borderRadius: 1,
                  background: isWeak
                    ? "rgba(248, 113, 113, 0.35)"
                    : isStrong
                    ? "rgba(52, 211, 153, 0.35)"
                    : "rgba(255, 255, 255, 0.12)",
                  transition: "background 300ms ease",
                }}
              />
              {/* Zone label */}
              <span
                style={{
                  fontSize: 7,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase" as const,
                  color: zone.color,
                  fontFamily: "'Inter', sans-serif",
                  textShadow: "0 1px 4px rgba(0,0,0,0.9)",
                  whiteSpace: "nowrap",
                  opacity: 0.8,
                }}
              >
                {zone.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* ═══ VERTICAL ZONE DIVIDERS (very subtle) ═══ */}
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
        {ZONE_DEFS.slice(1).map((_, i) => {
          const x = padX + ((i + 1) / 7) * rangeX;
          return (
            <line
              key={i}
              x1={x}
              y1={75}
              x2={x}
              y2={96}
              stroke="rgba(255, 255, 255, 0.04)"
              strokeWidth="0.3"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
    </div>
  );
};

export default MountainRegionLabels;

