import React, { useMemo } from "react";
import { useScenarioStore } from "@/state/scenarioStore";
import DivergencePanel from "./DivergencePanel";
import type { SimulationSnapshot } from "@/logic/divergence/computeDivergence";

export default function DivergencePanelAdapter(props: { scenarioId?: string }) {
  const baseline = useScenarioStore((s) => s.baseline);
  const savedScenarios = useScenarioStore((s) => s.savedScenarios);

  const { scenario, scenarioName } = useMemo(() => {
    // If scenarioId provided, select it; else choose most recently simulated.
    if (props.scenarioId) {
      const found = (savedScenarios ?? []).find((x) => x.id === props.scenarioId) ?? null;
      return { scenario: found, scenarioName: found?.name ?? "Scenario" };
    }

    const withSim = (savedScenarios ?? []).filter((x) => !!x?.simulation);
    if (withSim.length === 0) return { scenario: null, scenarioName: "Scenario" };

    const sorted = withSim.slice().sort((a, b) => {
      const ta = new Date(a.simulation!.simulatedAt).getTime();
      const tb = new Date(b.simulation!.simulatedAt).getTime();
      return tb - ta;
    });

    return { scenario: sorted[0], scenarioName: sorted[0]?.name ?? "Scenario" };
  }, [props.scenarioId, savedScenarios]);

  const baselineSnap = (baseline?.simulation ?? null) as SimulationSnapshot | null;
  const scenarioSnap = (scenario?.simulation ?? null) as SimulationSnapshot | null;

  return (
    <DivergencePanel
      baselineName={baseline?.name ?? "Baseline"}
      scenarioName={scenarioName}
      baseline={baselineSnap}
      scenario={scenarioSnap}
    />
  );
}
