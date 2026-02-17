import React from "react";
import PositionPage from "@/pages/position/PositionPage";
import type { LeverState } from "@/logic/calculateMetrics";

export type TerrainRouteProps = {
  hasBaseline: boolean;
  showSimulate: boolean;
  setShowSimulate: (show: boolean) => void;
  showSaveModal: boolean;
  setShowSaveModal: (show: boolean) => void;
  showLoadPanel: boolean;
  setShowLoadPanel: (show: boolean) => void;
  levers: LeverState;
  isSimulatingGlobal: boolean;
};

/**
 * /position MUST render PositionPage (TerrainStage + path system).
 * Legacy BaselinePage/ScenarioMountain is forbidden on /position.
 */
export default function TerrainRoute(_props: TerrainRouteProps) {
  return <PositionPage />;
}
