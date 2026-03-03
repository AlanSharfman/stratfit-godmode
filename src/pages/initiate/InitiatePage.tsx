import InitiatePanel from "./InitiatePanel";
import SimulationStatusWidget from "@/components/system/SimulationStatusWidget";
import SimulationRunOverlay from "@/components/system/SimulationRunOverlay";

export default function InitiatePage() {
  return (
    <div style={{ paddingTop: 72, position: "relative", minHeight: "100vh" }}>
      <SimulationStatusWidget />
      <SimulationRunOverlay />
      <InitiatePanel />
    </div>
  );
}
