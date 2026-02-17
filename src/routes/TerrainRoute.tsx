import React from "react";
import PositionPage from "@/pages/position/PositionPage";

/**
 * /position MUST render PositionPage (TerrainStage + path system).
 * Legacy BaselinePage/ScenarioMountain is forbidden on /position.
 */
export default function TerrainRoute() {
  return <PositionPage />;
}
