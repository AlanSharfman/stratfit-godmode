import React from "react";
import { LockedModule } from "./LockedModule";

export function StrategicModules() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 2,
          marginBottom: 2,
        }}
      >
        <div style={{ letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 800, fontSize: 12, color: "rgba(232,240,248,0.78)" }}>
          Strategic Modules
        </div>
        <div style={{ letterSpacing: "0.10em", textTransform: "uppercase", fontSize: 11, color: "rgba(34,211,238,0.78)" }}>
          Locked Preview
        </div>
      </div>

      <LockedModule
        title="Sensitivity Matrix"
        description="Instantly surfaces which lever (price, churn, growth, cost) is driving survivability and value."
        badge="COMING Q2 2026"
        gradient="linear-gradient(135deg, rgba(239,68,68,0.22), rgba(234,179,8,0.18), rgba(34,197,94,0.14))"
      />

      <LockedModule
        title="Advanced Goal Seek"
        description="Reverse-engineers the smallest set of moves needed to hit runway, margin, or valuation targets."
        badge="PREVIEW AVAILABLE"
        gradient="linear-gradient(135deg, rgba(168,85,247,0.22), rgba(99,102,241,0.18))"
      />

      <LockedModule
        title="Confidence Bands"
        description="Adds uncertainty ranges and stability scoring so you can see what's robust vs fragile."
        badge="RESEARCH PHASE"
        gradient="linear-gradient(135deg, rgba(34,197,94,0.20), rgba(34,211,238,0.16))"
      />

      <LockedModule
        title="Board Mode"
        description="One-click investor/board narrative pack with scenario deltas, risks, and decision options."
        badge="COMING Q2 2026"
        gradient="linear-gradient(135deg, rgba(249,115,22,0.18), rgba(99,102,241,0.16))"
      />
    </div>
  );
}


