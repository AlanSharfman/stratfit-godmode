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
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 50,
          pointerEvents: "auto",
          padding: "8px 10px",
          borderRadius: 10,
          border: "1px solid rgba(56,189,248,0.25)",
          background: "rgba(10,14,20,0.65)",
          color: "rgba(226,232,240,0.92)",
          fontSize: 12,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "0 14px 36px rgba(0,0,0,0.45)",
          cursor: "pointer",
        }}
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
