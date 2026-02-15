// src/pages/terrain/TerrainOverlays/OverlayTooltip.tsx
// STRATFIT — Shared overlay tooltip
// Calm. Short. No hype. No emoji. Title uppercase.

import React from "react";

interface OverlayTooltipProps {
  title: string;
  description: string;
  x: number;
  y: number;
  visible: boolean;
}

const OverlayTooltip: React.FC<OverlayTooltipProps> = ({
  title,
  description,
  x,
  y,
  visible,
}) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%, -100%) translateY(-12px)",
        background: "rgba(15, 23, 42, 0.95)",
        border: "1px solid rgba(0, 224, 255, 0.15)",
        borderRadius: 6,
        padding: "8px 12px",
        maxWidth: 220,
        pointerEvents: "none",
        zIndex: 30,
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase" as const,
          color: "rgba(0, 224, 255, 0.7)",
          marginBottom: 4,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 11,
          lineHeight: 1.45,
          color: "rgba(255, 255, 255, 0.65)",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {description}
      </div>
    </div>
  );
};

export default OverlayTooltip;





