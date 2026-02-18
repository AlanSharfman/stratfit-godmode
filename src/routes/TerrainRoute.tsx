import React from "react";
import PositionPage from "@/pages/position/PositionPage";
import type { LeverState } from "@/logic/calculateMetrics";

export type TerrainRouteProps = {
  hasBaseline?: boolean;
  showSimulate?: boolean;
  setShowSimulate?: (show: boolean) => void;
  showSaveModal?: boolean;
  setShowSaveModal?: (show: boolean) => void;
  showLoadPanel?: boolean;
  setShowLoadPanel?: (show: boolean) => void;
  levers?: LeverState;
  isSimulatingGlobal?: boolean;
};

/**
 * /position MUST render PositionPage (TerrainStage + path system).
 * Legacy BaselinePage/ScenarioMountain is forbidden on /position.
 */
export default function TerrainRoute(_props: TerrainRouteProps) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <PositionPage />
      <HotkeyLegend />
    </div>
  );
}

const KEYS: { key: string; label: string; dim?: boolean }[] = [
  { key: "H", label: "Hero / Neutral" },
  { key: "R", label: "Reset camera" },
  { key: "D", label: "Diagnostics", dim: true },
];

function HotkeyLegend() {
  return (
    <div
      style={{
        position: "fixed",
        left: 16,
        bottom: 16,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 11,
        pointerEvents: "none",
        zIndex: 900,
        userSelect: "none",
      }}
    >
      {KEYS.map(({ key, label, dim }) => (
        <div
          key={key}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            opacity: dim ? 0.35 : 0.6,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 20,
              height: 20,
              borderRadius: 4,
              background: "rgba(6,18,24,0.65)",
              border: "1px solid rgba(34,211,238,0.25)",
              color: "rgba(234,251,255,0.9)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.5,
              backdropFilter: "blur(6px)",
            }}
          >
            {key}
          </span>
          <span style={{ color: "rgba(148,163,184,0.8)" }}>{label}</span>
        </div>
      ))}
    </div>
  );
}
