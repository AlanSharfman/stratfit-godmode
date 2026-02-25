import type { ScenarioDraft } from "./scenarioDraft";

export function createScenarioB(base: ScenarioDraft): ScenarioDraft {
  const now = Date.now();

  return {
    ...base,
    id: `sB_${base.questionContext.id}`,
    name: "Scenario B",
    createdAtISO: new Date(now).toISOString(),
    inputs: {},
    outputs: {},
  };
}
