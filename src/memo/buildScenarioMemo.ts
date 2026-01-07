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

export type ScenarioKey = "base" | "upside" | "downside" | "extreme";

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

export type ScenarioAssessmentLike = {
  systemState: { financial: string; operational: string; execution: string };
  observations: string[];
  risks: Array<{ severity: string; title: string; driver: string; impact: string }>;
  attention: string[];
  assumptionFlags: string[];
  strategicQuestions?: Array<{ question: string; answer: string }>;
};

const MAX_EXEC_SUMMARY = 5;
const MAX_KEY_OBS = 4;
const MAX_RISK = 3;
const MAX_LEADERSHIP = 3;
const MAX_ASSUMPTIONS = 2;
const MAX_STRATEGIC_QA = 2;

function uniq(arr: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    const k = String(s ?? "").trim();
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

function pickExecutiveSummary(assessment: ScenarioAssessmentLike): string[] {
  const bullets: string[] = [];
  bullets.push(...assessment.observations.slice(0, 2));

  const s = assessment.systemState;
  bullets.push(`System state indicates a ${s.financial} financial posture with ${s.execution} execution sensitivity.`);

  const topRisk = assessment.risks[0];
  if (topRisk?.title) bullets.push(`Primary structural driver centers on ${topRisk.title}.`);

  if (assessment.attention[0]) bullets.push(assessment.attention[0]);

  const cleaned = uniq(bullets).slice(0, MAX_EXEC_SUMMARY);
  while (cleaned.length < 3) cleaned.push("Signals remain consistent with the current scenario posture.");
  return cleaned.slice(0, MAX_EXEC_SUMMARY);
}

export function buildScenarioIntelligence(params: {
  scenarioId: string;
  scenarioName: string;
  preparedAt: string; // ISO
  modelVersion: string;
  assessment: ScenarioAssessmentLike;
  // Optional override when AI answers are enabled (already validated board-safe).
  strategicQAOverride?: Array<{ question: string; answer: string }>;
}): ScenarioIntelligence {
  const { assessment } = params;
  const exec = pickExecutiveSummary(assessment);
  const strategicQA = params.strategicQAOverride ?? assessment.strategicQuestions ?? [];

  return {
    scenarioId: params.scenarioId,
    scenarioName: params.scenarioName,
    preparedAt: params.preparedAt,
    modelVersion: params.modelVersion,
    executiveSummary: exec,
    systemState: assessment.systemState,
    keyObservations: uniq(assessment.observations).slice(0, MAX_KEY_OBS),
    riskSignals: assessment.risks.slice(0, MAX_RISK),
    leadershipAttention: uniq(assessment.attention).slice(0, MAX_LEADERSHIP),
    ...(assessment.assumptionFlags?.length ? { assumptionFlags: assessment.assumptionFlags.slice(0, MAX_ASSUMPTIONS) } : {}),
    ...(strategicQA?.length ? { strategicQA: strategicQA.slice(0, MAX_STRATEGIC_QA) } : {}),
    traceability:
      "Traceability: derived from scenario intelligence signals across runway posture, growth momentum, efficiency tolerance, and execution risk relative to baseline.",
  };
}

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
