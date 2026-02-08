// src/components/terrain/TerrainOverlayToggles.tsx
// STRATFIT — Terrain Overlay Toggle Controls
// INTELLIGENCE · RISK DENSITY
// Uppercase, 12–13px, muted white 70%, active cyan underline 2px

import React from "react";

interface TerrainOverlayTogglesProps {
  intelligenceEnabled: boolean;
  riskDensityEnabled: boolean;
  onToggleIntelligence: () => void;
  onToggleRiskDensity: () => void;
}

const toggleStyle = (active: boolean): React.CSSProperties => ({
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: active ? "rgba(0, 224, 255, 0.9)" : "rgba(255, 255, 255, 0.5)",
  background: "none",
  border: "none",
  borderBottom: active ? "2px solid rgba(0, 224, 255, 0.7)" : "2px solid transparent",
  padding: "6px 10px",
  cursor: "pointer",
  fontFamily: "'Inter', sans-serif",
  transition: "color 150ms ease, border-color 150ms ease",
  whiteSpace: "nowrap",
});

const TerrainOverlayToggles: React.FC<TerrainOverlayTogglesProps> = ({
  intelligenceEnabled,
  riskDensityEnabled,
  onToggleIntelligence,
  onToggleRiskDensity,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 16,
        zIndex: 25,
        display: "flex",
        alignItems: "center",
        gap: 2,
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(8px)",
        borderRadius: 6,
        padding: "2px 4px",
        border: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      <button
        type="button"
        onClick={onToggleIntelligence}
        style={toggleStyle(intelligenceEnabled)}
      >
        Intelligence
      </button>
      <span style={{
        width: 1,
        height: 14,
        background: "rgba(255, 255, 255, 0.1)",
      }} />
      <button
        type="button"
        onClick={onToggleRiskDensity}
        style={toggleStyle(riskDensityEnabled)}
      >
        Risk Density
      </button>
    </div>
  );
};

export default TerrainOverlayToggles;





