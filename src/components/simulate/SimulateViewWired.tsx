import React, { useMemo } from "react";

import SimulateView from "./SimulateView";
import { useSimulationStore } from "@/state/simulationStore";
import { reduceToVerdict } from "@/logic/simulateReducer";

/**
 * Legacy wiring file — kept during the Simulate → SimulateLab transition.
 * Do not delete until SimulateLab is fully verified and adopted everywhere.
 */
export default function SimulateViewWired({ onBack }: { onBack: () => void }) {
  const fullResult = useSimulationStore((s) => s.fullResult);

  const verdict = useMemo(() => {
    if (!fullResult) return null;
    return reduceToVerdict(fullResult);
  }, [fullResult]);

  if (!verdict) {
    return (
      <div className="p-6 text-slate-200">
        <div className="text-sm font-semibold">No simulation yet.</div>
        <div className="text-xs text-slate-400 mt-1">Run Simulate to generate a verdict.</div>
      </div>
    );
  }

  return <SimulateView verdict={verdict} onBack={onBack} />;
}