import React from "react";
import { ScenarioMountainImpl, type ScenarioMountainProps } from "./ScenarioMountainImpl";

export function ScenarioMountain(props: ScenarioMountainProps) {
  return <ScenarioMountainImpl {...props} />;
}

export default ScenarioMountain;
