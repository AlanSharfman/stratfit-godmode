import React from "react";
import { useSimulationSummary } from "@/state/simulationStore";

export default function DemoExecutiveOverlay({ visible }: { visible: boolean }) {
  const summary = useSimulationSummary();

  if (!visible || !summary) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: "rgba(0,0,0,0.7)",
          borderRadius: 20,
          padding: 24,
          width: 420,
          textAlign: "center",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <h3 style={{ marginBottom: 10 }}>Executive Insight</h3>
        <p>Survival Probability: {summary.survivalPercent}</p>
        <p>Primary Risk: {summary.primaryRisk}</p>
        <p>Recommendation: {summary.topRecommendation}</p>
      </div>
    </div>
  );
}
