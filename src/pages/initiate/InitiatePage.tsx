import InitiatePanel from "./InitiatePanel";
import SimulationStatusWidget from "@/components/system/SimulationStatusWidget";
import SimulationRunOverlay from "@/components/system/SimulationRunOverlay";
import SimulationPipelineWidget from "@/components/system/SimulationPipelineWidget";

export default function InitiatePage() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg, #030712 0%, #0a1628 100%)",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#e2e8f0",
      }}
    >
      <SimulationStatusWidget />
      <SimulationRunOverlay />
      <SimulationPipelineWidget />
      {/* Spacer for fixed nav */}
      <div style={{ height: 56, flexShrink: 0 }} />
      <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 32px" }}>
        <InitiatePanel />
      </div>
    </div>
  );
}
