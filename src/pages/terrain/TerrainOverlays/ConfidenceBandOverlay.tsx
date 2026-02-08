// src/pages/terrain/TerrainOverlays/ConfidenceBandOverlay.tsx
// STRATFIT — Confidence Band Overlay (Variance Envelope)
// Ghost band around crest/peak region. Low opacity.
// Approximated from scenario spread. Must not look like fog.

import React, { useMemo } from "react";

interface ConfidenceBandOverlayProps {
  enabled: boolean;
  dataPoints: number[];  // 7-vector normalized 0–1
  variance: number;      // 0–1 derived from scenario spread
}

/**
 * SVG variance envelope around the median trajectory.
 * Width proportional to real variance between scenarios.
 */
const ConfidenceBandOverlay: React.FC<ConfidenceBandOverlayProps> = ({
  enabled,
  dataPoints,
  variance,
}) => {
  const { upperPath, lowerPath } = useMemo(() => {
    if (!enabled || !dataPoints.length) return { upperPath: "", lowerPath: "" };

    const padX = 8;
    const padY = 15;
    const rangeX = 100 - 2 * padX;
    const rangeY = 100 - 2 * padY;

    // Band width proportional to variance (5–15% of range)
    const bandHalf = Math.max(3, Math.min(12, variance * 15));

    const upperPoints: string[] = [];
    const lowerPoints: string[] = [];

    dataPoints.forEach((v, i) => {
      const x = padX + (i / Math.max(1, dataPoints.length - 1)) * rangeX;
      const yCenter = (100 - padY) - v * rangeY;
      const yUpper = Math.max(padY, yCenter - bandHalf);
      const yLower = Math.min(100 - padY, yCenter + bandHalf);

      upperPoints.push(`${x.toFixed(1)},${yUpper.toFixed(1)}`);
      lowerPoints.push(`${x.toFixed(1)},${yLower.toFixed(1)}`);
    });

    // Closed polygon: upper left→right, then lower right→left
    const upper = `M ${upperPoints.join(" L ")}`;
    const lower = `L ${lowerPoints.reverse().join(" L ")} Z`;

    return { upperPath: upper, lowerPath: lower };
  }, [enabled, dataPoints, variance]);

  if (!enabled || !upperPath) return null;

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
        zIndex: 4,
      }}
    >
      <defs>
        <linearGradient id="confidenceBandGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00E0FF" stopOpacity="0.06" />
          <stop offset="50%" stopColor="#00E0FF" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#00E0FF" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <path
        d={`${upperPath} ${lowerPath}`}
        fill="url(#confidenceBandGrad)"
        stroke="rgba(0, 224, 255, 0.08)"
        strokeWidth="0.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

export default ConfidenceBandOverlay;





