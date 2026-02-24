import React, { useMemo } from "react";
import { useScenarioStore } from "@/state/scenarioStore";
import NarrativeExplanationBlock from "./NarrativeExplanationBlock";
import type { SimulationSnapshot } from "@/logic/narrative/generateNarrative";

export default function NarrativeExplanationPanel() {
  // Primitive selectors only.
  const baseline = useScenarioStore((s) => s.baseline);
  const savedScenarios = useScenarioStore((s) => s.savedScenarios);

  const snapshot = useMemo<SimulationSnapshot | null>(() => {
    // Prefer baseline snapshot if it exists (pinned truth)
    if (baseline?.simulation) return baseline.simulation as SimulationSnapshot;

    // Otherwise pick the most recently simulated saved scenario (by simulatedAt)
    const withSim = (savedScenarios ?? []).filter((x) => !!x?.simulation);
    if (withSim.length === 0) return null;

    const sorted = withSim
      .slice()
      .sort((a, b) => {
        const ta = new Date(a.simulation!.simulatedAt).getTime();
        const tb = new Date(b.simulation!.simulatedAt).getTime();
        return tb - ta;
      });

    return (sorted[0].simulation ?? null) as SimulationSnapshot | null;
  }, [baseline, savedScenarios]);

  return <NarrativeExplanationBlock snapshot={snapshot} />;
}
