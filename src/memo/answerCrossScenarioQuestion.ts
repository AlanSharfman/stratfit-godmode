// PHRASE BANK for deterministic, investor-safe outputs
export const PhraseBank = {
  observationOpeners: [
    "In this scenario, operational posture remains stable.",
    "Current conditions reflect a balanced approach to resilience.",
    "Scenario signals indicate a steady environment.",
    "Strategic priorities are maintained across the scenario.",
    "Resilience is supported by disciplined execution.",
    "The scenario presents a consistent risk profile.",
  ],
  riskSignalTemplates: [
    "Attention is required for concentrated risk factors.",
    "Risk signals are contained and monitored.",
    "Elevated risk is present in specific domains.",
    "Scenario introduces moderate risk concentration.",
    "Risk posture remains within expected bounds.",
    "Operational risk is balanced and observable.",
    "Scenario maintains a credible risk profile.",
    "Risk signals are directionally stable.",
  ],
  actionTemplates: [
    "Maintain disciplined execution across key areas.",
    "Monitor scenario signals for directional changes.",
    "Strategic focus is sustained on core priorities.",
    "Continue to observe scenario posture for adjustments.",
    "Attention to operational discipline is recommended.",
    "Scenario supports ongoing review of strategic signals.",
    "Maintain clarity in scenario communication.",
    "Scenario actions are aligned with board priorities.",
  ],
  crossScenarioConclusions: [
    "Cross-scenario signals indicate a stable posture.",
    "Scenario comparison supports a balanced narrative.",
    "Relative scenario signals are directionally consistent.",
    "Scenario differences are observable but contained.",
    "Board narrative remains credible across scenarios.",
    "Scenario signals support a resilient posture.",
    "Scenario analysis confirms strategic alignment.",
    "Scenario signals are directionally clear.",
  ],
  confidenceLines: [
    "Confidence: Medium — based on scenario signals.",
    "Confidence: Medium — signals are stable and observable.",
    "Confidence: Medium — scenario posture is consistent.",
  ],
};
// src/memo/answerCrossScenarioQuestion.ts
// Deterministic Q&A engine for cross-scenario interrogation
// No LLM, no new metrics, no raw numbers, investor-safe output

import { ScenarioFactPack } from "./buildScenarioFactPack";

// Intent classifier
export type QuestionIntent =
  | "RESILIENCE"
  | "RISK"
  | "EXECUTION"
  | "INVESTOR_NARRATIVE"
  | "COMPARISON"
  | "UNKNOWN";

export function classifyQuestion(q: string): QuestionIntent {
  const s = q.toLowerCase();
  if (s.match(/resilien|runway|cash|surviv|durable|stable/)) return "RESILIENCE";
  if (s.match(/risk|downside|break|fragil|stress|exposed/)) return "RISK";
  if (s.match(/execute|operat|deliver|capacity|complex/)) return "EXECUTION";
  if (s.match(/investor|board|story|narrative|credible/)) return "INVESTOR_NARRATIVE";
  if (s.match(/compare|versus|vs|difference|relative/)) return "COMPARISON";
  return "UNKNOWN";
}

// Band scores for ranking
const BAND_SCORE = {
  runwayBand: { short: 0, medium: 1, long: 2 },
  riskBand: { high: 0, moderate: 1, low: 2 },
  growthBand: { low: 0, moderate: 1, high: 2 },
  executionBand: { elevated: 0, moderate: 1, optimal: 2 },
};

function getScenarioRank(facts: {
  runwayBand?: keyof typeof BAND_SCORE.runwayBand;
  riskBand?: keyof typeof BAND_SCORE.riskBand;
  executionBand?: keyof typeof BAND_SCORE.executionBand;
}): { resilienceScore: number; riskScore: number; executionScore: number } {
  const runwayScore = facts.runwayBand ? BAND_SCORE.runwayBand[facts.runwayBand] : 1;
  const riskScore = facts.riskBand ? BAND_SCORE.riskBand[facts.riskBand] : 1;
  const executionScore = facts.executionBand ? BAND_SCORE.executionBand[facts.executionBand] : 1;
  return {
    resilienceScore: runwayScore * 0.6 + riskScore * 0.4,
    riskScore,
    executionScore,
  };
}

function softenForInvestor(text: string): string {
  return text
    .replace(/pressure/gi, "attention")
    .replace(/failure/gi, "breakdown")
    .replace(/stress/gi, "strain")
    .replace(/aggressive/gi, "ambitious");
}

export function answerCrossScenarioQuestion({
  questionText,
  packs,
  comparedToBase,
  mode,
}: {
  questionText: string;
  packs: ScenarioFactPack[];
  comparedToBase: boolean;
  mode: "operator" | "investor";
}): { bullets: string[]; tags?: string[] } {
  // Deterministic phrase-locked output
  const intent = classifyQuestion(questionText);
  let bullets: string[] = [];
  if (mode === "investor") {
    if (intent === "RESILIENCE") {
      bullets = [
        PhraseBank.observationOpeners[0],
        PhraseBank.observationOpeners[1],
        PhraseBank.riskSignalTemplates[0],
        PhraseBank.riskSignalTemplates[1],
        PhraseBank.confidenceLines[0],
      ];
    } else if (intent === "RISK") {
      bullets = [
        PhraseBank.riskSignalTemplates[2],
        PhraseBank.riskSignalTemplates[3],
        PhraseBank.riskSignalTemplates[4],
        PhraseBank.riskSignalTemplates[5],
        PhraseBank.confidenceLines[1],
      ];
    } else if (intent === "EXECUTION") {
      bullets = [
        PhraseBank.actionTemplates[0],
        PhraseBank.actionTemplates[1],
        PhraseBank.actionTemplates[2],
        PhraseBank.actionTemplates[3],
        PhraseBank.confidenceLines[2],
      ];
    } else if (intent === "INVESTOR_NARRATIVE") {
      bullets = [
        PhraseBank.crossScenarioConclusions[0],
        PhraseBank.crossScenarioConclusions[1],
        PhraseBank.crossScenarioConclusions[2],
        PhraseBank.crossScenarioConclusions[3],
        PhraseBank.confidenceLines[0],
      ];
    } else if (intent === "COMPARISON" && comparedToBase) {
      bullets = [
        PhraseBank.crossScenarioConclusions[4],
        PhraseBank.crossScenarioConclusions[5],
        PhraseBank.crossScenarioConclusions[6],
        PhraseBank.crossScenarioConclusions[7],
        PhraseBank.confidenceLines[1],
      ];
    } else {
      bullets = [
        PhraseBank.observationOpeners[2],
        PhraseBank.riskSignalTemplates[6],
        PhraseBank.actionTemplates[4],
        PhraseBank.crossScenarioConclusions[0],
        PhraseBank.confidenceLines[2],
      ];
    }
    // Guard: reject any bullet with digits, $, %, m, k, or currency words
    bullets = bullets.map(b =>
      /[0-9$%mk]|million|billion|usd|eur|gbp|yen|dollar|euro|pound|percent/i.test(b)
        ? "Signal is directionally clear, but requires validation."
        : b
    );
    const isDev = (import.meta as any)?.env?.DEV === true;
    if (isDev) {
      bullets.forEach(b => {
        if (/[0-9$%mk]|million|billion|usd|eur|gbp|yen|dollar|euro|pound|percent/i.test(b)) {
          // eslint-disable-next-line no-console
          console.error("PhraseBank guard: rejected bullet:", b);
        }
      });
    }
    bullets = bullets.slice(0, 6);
    return { bullets };
  }
  // Operator mode: legacy output
  // ...existing code...
  const scenarioOrder = ["base", "upside", "downside", "extreme"];
  const packMap = Object.fromEntries(packs.map(p => [p.scenario, p]));
  // ...existing code...
  return { bullets: bullets.slice(0, 6) };
}
