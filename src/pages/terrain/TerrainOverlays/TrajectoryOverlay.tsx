// src/pages/terrain/TerrainOverlays/TrajectoryOverlay.tsx
// STRATFIT — Baseline Trajectory Path Overlay
// Thin cyan line, 1px, no glow, no animation.
// Approximates median trajectory from existing dataPoints.

import React, { useMemo } from "react";

interface TrajectoryOverlayProps {
  enabled: boolean;
  dataPoints: number[];  // 7-vector, normalized 0–1
}

/**
 * SVG polyline representing expected baseline trajectory.
 * Derived from existing engine outputs (dataPoints 7-vector).
 */
const TrajectoryOverlay: React.FC<TrajectoryOverlayProps> = ({
  enabled,
  dataPoints,
}) => {
  const pathD = useMemo(() => {
    if (!enabled || !dataPoints.length) return "";

    // Map 7-vector to SVG coordinates
    // X: evenly distributed across width (with padding)
    // Y: inverted (higher value = higher on screen)
    const padX = 8; // percentage
    const padY = 15;
    const rangeX = 100 - 2 * padX;
    const rangeY = 100 - 2 * padY;

    const points = dataPoints.map((v, i) => {
      const x = padX + (i / Math.max(1, dataPoints.length - 1)) * rangeX;
      const y = (100 - padY) - v * rangeY;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `M ${points.join(" L ")}`;
  }, [enabled, dataPoints]);

  if (!enabled || !pathD) return null;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 6,
      }}
    >
      {/* Subtle shadow line for depth */}
      <path
        d={pathD}
        fill="none"
        stroke="rgba(0, 224, 255, 0.08)"
        strokeWidth="3"
        vectorEffect="non-scaling-stroke"
      />
      {/* Primary trajectory line */}
      <path
        d={pathD}
        fill="none"
        stroke="#00E0FF"
        strokeWidth="1"
        strokeOpacity="0.5"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default TrajectoryOverlay;





