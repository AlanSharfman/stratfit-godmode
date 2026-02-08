// src/pages/terrain/TerrainOverlays/HeatmapOverlay.tsx
// STRATFIT — Risk Density Heatmap Overlay
// 20% opacity max · Color ramp: indigo → neutral → red
// Derived from existing engine outputs only. No new simulation runs.

import React, { useMemo } from "react";

interface HeatmapOverlayProps {
  enabled: boolean;
  riskScore: number;   // 0–100 (higher = more dangerous)
  variance: number;    // 0–1 (derived from scenario spread)
}

/**
 * CSS gradient overlay derived from real risk metrics.
 * No WebGL. No duplicate calculation. Pure CSS.
 */
const HeatmapOverlay: React.FC<HeatmapOverlayProps> = ({
  enabled,
  riskScore,
  variance,
}) => {
  const gradient = useMemo(() => {
    if (!enabled) return "none";

    // Normalize risk to 0–1
    const risk01 = Math.max(0, Math.min(1, riskScore / 100));
    const var01 = Math.max(0, Math.min(1, variance));

    // Low risk → indigo tint, high risk → red tint
    // Variance controls spread intensity
    const indigoAlpha = Math.max(0, (1 - risk01) * 0.15 * (0.5 + var01 * 0.5));
    const redAlpha = Math.max(0, risk01 * 0.18 * (0.5 + var01 * 0.5));

    return `linear-gradient(
      180deg,
      rgba(99, 102, 241, ${indigoAlpha.toFixed(3)}) 0%,
      transparent 35%,
      transparent 65%,
      rgba(239, 68, 68, ${redAlpha.toFixed(3)}) 100%
    )`;
  }, [enabled, riskScore, variance]);

  if (!enabled) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: gradient,
        pointerEvents: "none",
        zIndex: 5,
        borderRadius: 10,
        opacity: 0.85,
        mixBlendMode: "normal",
      }}
    />
  );
};

export default HeatmapOverlay;





