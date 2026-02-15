import React, { useMemo } from "react";
import "./DualMountainInstrument.css";

import { useShallow } from "zustand/react/shallow";

import ScenarioMountain from "@/components/mountain/ScenarioMountain";
import { TerrainWithFallback } from "@/components/terrain/TerrainFallback2D";
import { engineResultToMountainForces } from "@/logic/mountainForces";
import { type ScenarioId, useScenarioStore } from "@/state/scenarioStore";

const BASELINE_SCENARIO_ID: ScenarioId = "base";

export default function DualMountainInstrument() {
  const { activeScenarioId, engineResults, hoveredKpiIndex } =
    useScenarioStore(
      useShallow((s) => ({
        activeScenarioId: s.activeScenarioId,
        engineResults: s.engineResults,
        hoveredKpiIndex: s.hoveredKpiIndex,
      }))
    );

  const baselineEngineResult = engineResults?.[BASELINE_SCENARIO_ID];
  const activeEngineResult = engineResults?.[activeScenarioId];

  const baselineDataPoints = useMemo(() => {
    return engineResultToMountainForces(baselineEngineResult);
  }, [baselineEngineResult]);

  const activeDataPoints = useMemo(() => {
    return engineResultToMountainForces(activeEngineResult);
  }, [activeEngineResult]);

  return (
    <div className="dual-mountain-shell">
      <div className="mountain-card">
        <div className="mountain-title">BASELINE</div>
        <div className="mountain-canvas-bay" data-scenario={BASELINE_SCENARIO_ID}>
          <TerrainWithFallback dataPoints={baselineDataPoints}>
            <ScenarioMountain
              scenario={BASELINE_SCENARIO_ID}
              dataPoints={baselineDataPoints}
              activeKpiIndex={hoveredKpiIndex}
              className="sf-compare-mountain"
            />
          </TerrainWithFallback>
        </div>
      </div>

      <div className="mountain-card">
        <div className="mountain-title">STRATEGY</div>
        <div className="mountain-canvas-bay" data-scenario={activeScenarioId}>
          <TerrainWithFallback dataPoints={activeDataPoints}>
            <ScenarioMountain
              scenario={activeScenarioId}
              dataPoints={activeDataPoints}
              activeKpiIndex={hoveredKpiIndex}
              className="sf-compare-mountain"
            />
          </TerrainWithFallback>
        </div>
      </div>
    </div>
  );
}


