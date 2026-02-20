import React from "react";
import { TerrainWithFallback } from "@/components/terrain/TerrainFallback2D";
import ScenarioMountain from "@/components/mountain/ScenarioMountain";
import { useScenarioStore } from "@/state/scenarioStore";
import "@/styles/mountainBackplate.css";

export default function StudioSceneRoot() {
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId);

  return (
    <div
      className="sf-mountain-backplate"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <TerrainWithFallback>
        <ScenarioMountain
          scenario={activeScenarioId}
          mode="strategy"
          pathColor="#22d3ee"
          baselineHighVisibility

          transparentContainer
          transparentScene
        />
      </TerrainWithFallback>
    </div>
  );
}
