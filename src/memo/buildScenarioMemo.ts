// src/memo/buildScenarioMemo.ts
// Pure function to map Scenario Intelligence output to memo-ready object
// Truncates sections, omits empty optionals, no new calculations

export type ScenarioIntelligence = {
  scenarioId: string;
  scenarioName: string;
  preparedAt: string; // ISO string
  modelVersion: string;
  executiveSummary: string[];
  systemState: {
    financial: string;
    operational: string;
    execution: string;
  };
  keyObservations: string[];
  riskSignals: Array<{
    severity: string;
    title: string;
    driver: string;
    impact: string;
  }>;
  leadershipAttention: string[];
  assumptionFlags?: string[];
  strategicQA?: Array<{ question: string; answer: string }>;
  traceability: string;
};

export type ScenarioMemo = {
  scenarioId: string;
  scenarioName: string;
  preparedAt: string;
  modelVersion: string;
  executiveSummary: string[];
  systemState: {
    financial: string;
    operational: string;
    execution: string;
  };
  keyObservations: string[];
  riskSignals: Array<{
    severity: string;
    title: string;
    driver: string;
    impact: string;
  }>;
  leadershipAttention: string[];
  assumptionFlags?: string[];
  strategicQA?: Array<{ question: string; answer: string }>;
  traceability: string;
};

const MAX_EXEC_SUMMARY = 5;
const MAX_KEY_OBS = 4;
const MAX_RISK = 3;
const MAX_LEADERSHIP = 3;
const MAX_ASSUMPTIONS = 2;
const MAX_STRATEGIC_QA = 2;

export function buildScenarioMemo(intel: ScenarioIntelligence): ScenarioMemo {
  return {
    scenarioId: intel.scenarioId,
    scenarioName: intel.scenarioName,
    preparedAt: intel.preparedAt,
    modelVersion: intel.modelVersion,
    executiveSummary: intel.executiveSummary.slice(0, MAX_EXEC_SUMMARY),
    systemState: {
      financial: intel.systemState.financial,
      operational: intel.systemState.operational,
      execution: intel.systemState.execution,
    },
    keyObservations: intel.keyObservations.slice(0, MAX_KEY_OBS),
    riskSignals: intel.riskSignals.slice(0, MAX_RISK),
    leadershipAttention: intel.leadershipAttention.slice(0, MAX_LEADERSHIP),
    ...(intel.assumptionFlags && intel.assumptionFlags.length > 0
      ? { assumptionFlags: intel.assumptionFlags.slice(0, MAX_ASSUMPTIONS) }
      : {}),
    ...(intel.strategicQA && intel.strategicQA.length > 0
      ? { strategicQA: intel.strategicQA.slice(0, MAX_STRATEGIC_QA) }
      : {}),
    traceability: intel.traceability,
  };
}
