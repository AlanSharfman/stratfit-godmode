import React, { useCallback, useState } from "react";
import { TerrainWithFallback } from "@/components/terrain/TerrainFallback2D";
import ScenarioMountain from "@/components/mountain/ScenarioMountain";
import { useScenarioStore } from "@/state/scenarioStore";
import "@/styles/mountainBackplate.css";

export default function StudioSceneRoot() {
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId);
  const [resetViewKey, setResetViewKey] = useState(0);

  const onResetView = useCallback(() => {
    setResetViewKey((k) => k + 1);
  }, []);

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
      <button
        type="button"
        onClick={onResetView}
        className="sf-resetViewBtn"
      >
        Reset View
      </button>
      <TerrainWithFallback>
        <ScenarioMountain
          scenario={activeScenarioId}
          mode="strategy"
          pathColor="#22d3ee"
          baselineHighVisibility
          resetViewKey={resetViewKey}

          transparentContainer
          transparentScene
        />
      </TerrainWithFallback>
    </div>
  );
}
