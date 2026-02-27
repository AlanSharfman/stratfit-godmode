import React, { useMemo } from "react";
import ScenarioDiffInspector, { type LeverSnapshot } from "./ScenarioDiffInspector";
import { useScenarioStore } from "@/state/scenarioStore";

export default function ScenarioDiffInspectorPanel() {
  // ─────────────────────────────────────────────────────────────
  // EDIT POINT #1 — baseline scenario selector
  // scenarioStore.baseline is the pinned Scenario | null
  // ─────────────────────────────────────────────────────────────
  const baselineScenario = useScenarioStore((s) => s.baseline);

  // ─────────────────────────────────────────────────────────────
  // EDIT POINT #2 — comparison scenario selector
  // savedScenarios is Scenario[]; we pick the most recently
  // updated non-baseline entry as the "active" comparison target.
  // ─────────────────────────────────────────────────────────────
  const savedScenarios = useScenarioStore((s) => s.savedScenarios);

  const activeScenario = useMemo(() => {
    if (!savedScenarios?.length) return null;
    const nonBaseline = savedScenarios.filter((x) => !x.isBaseline);
    if (!nonBaseline.length) return null;
    // Most recently updated first
    return nonBaseline.reduce((latest, x) =>
      new Date(x.updatedAt ?? 0) > new Date(latest.updatedAt ?? 0) ? x : latest
    );
  }, [savedScenarios]);

  const baselineLevers = (baselineScenario?.levers ?? null) as LeverSnapshot | null;
  const activeLevers = (activeScenario?.levers ?? null) as LeverSnapshot | null;

  return (
    <ScenarioDiffInspector
      baselineName={baselineScenario?.name ?? "Baseline"}
      scenarioName={activeScenario?.name ?? "Scenario"}
      baseline={baselineLevers}
      scenario={activeLevers}
    />
  );
}
