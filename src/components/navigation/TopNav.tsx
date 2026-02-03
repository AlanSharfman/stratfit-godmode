import React from "react";
import { MainNav } from "./MainNav";

type NavId =
  | "onboarding"
  | "terrain"
  | "strategy"
  | "compare"
  | "risk"
  | "valuation"
  | "decision";

export default function TopNav(props: {
  activeItemId?: NavId | string;
  onNavigate?: (id: NavId) => void;
  activeScenarioLabel?: string;
  className?: string;
  onSave?: () => void;
  onLoad?: () => void;
  onExport?: () => void;
  onShare?: () => void;
}) {
  const activeItemId = (props.activeItemId as NavId) ?? "terrain";
  const onNavigate = props.onNavigate ?? (() => {});
  const activeScenarioLabel = props.activeScenarioLabel ?? "Current Trajectory";

  return (
    <div className={props.className}>
      <MainNav
        activeScenario={{ name: activeScenarioLabel, lastModified: "Active" }}
        activeItemId={activeItemId}
        onNavigate={onNavigate}
        onSave={props.onSave}
        onLoad={props.onLoad}
        onExport={props.onExport}
        onShare={props.onShare}
      />
    </div>
  );
}


