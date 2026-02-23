import React from "react";
import { useLocation } from "react-router-dom";

import CompareView from "@/components/compare/CompareView";
import { CompareGodMode } from "@/components/compare/CompareGodMode";
import SimulationTelemetryRibbon from "@/components/simulation/SimulationTelemetryRibbon";
import SimulationActivityMonitor from "@/components/system/SimulationActivityMonitor";

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export default function CompareRoute() {
  const q = useQuery();
  const viz = q.get("viz"); // "god" enables the lava divergence canvas

  return (
    <>
      {viz === "god" ? <CompareGodMode /> : <CompareView />}

      {/* Telemetry overlays */}
      <SimulationTelemetryRibbon />
      <SimulationActivityMonitor />
    </>
  );
}
