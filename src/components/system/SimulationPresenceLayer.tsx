import React from "react";
import SimulationActivityMonitor from "@/components/system/SimulationActivityMonitor";
import SimulationTelemetryRibbon from "@/components/simulation/SimulationTelemetryRibbon";
import { useEngineActivityStore } from "@/state/engineActivityStore";

export default function SimulationPresenceLayer() {
  const { isRunning, stage, message } = useEngineActivityStore();

  // Always mount monitor/ribbon (they self-hide when idle),
  // plus a minimal ticker only while running.
  return (
    <>
      <SimulationActivityMonitor />
      <SimulationTelemetryRibbon />

      {isRunning && (
        <div
          style={{
            position: "fixed",
            right: 14,
            bottom: 14,
            zIndex: 9999,
            pointerEvents: "none",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: 11,
            lineHeight: 1.2,
            opacity: 0.9,
            padding: "8px 10px",
            borderRadius: 12,
            border: "1px solid rgba(0,224,255,0.25)",
            background: "rgba(8,12,18,0.72)",
            color: "rgba(224,245,255,0.92)",
            backdropFilter: "blur(10px)",
            maxWidth: 360,
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          }}
          aria-label="Simulation ticker"
        >
          <div style={{ opacity: 0.75 }}>ENGINE · {stage}</div>
          <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {message ?? "Running…"}
          </div>
        </div>
      )}
    </>
  );
}
