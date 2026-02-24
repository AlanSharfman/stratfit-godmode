import React, { useMemo } from "react";
import { useEngineActivityStore } from "@/state/engineActivityStore";

export default function SimulationProgressTicker() {
  const stage = useEngineActivityStore((s) => s.stage);
  const iterationsTarget = useEngineActivityStore((s) => s.iterationsTarget);
  const iterationsCompleted = useEngineActivityStore((s) => s.iterationsCompleted);

  // Derive percent — no percentComplete field on store.
  const percent = useMemo(
    () => (iterationsTarget > 0 ? (iterationsCompleted / iterationsTarget) * 100 : 0),
    [iterationsCompleted, iterationsTarget]
  );

  return (
    <div className="simulationTicker">
      <div>Stage: {stage}</div>
      <div>Progress: {percent.toFixed(1)}%</div>
      <div>Iterations: {iterationsCompleted}</div>
    </div>
  );
}
