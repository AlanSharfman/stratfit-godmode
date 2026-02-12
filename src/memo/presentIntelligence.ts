// src/memo/presentIntelligence.ts
// PRESENTATION TRANSFORM LAYER — Investor-Safe Summary Mode
// This function transforms Scenario Intelligence output for presentation ONLY.
// It does NOT alter calculations, logic, thresholds, or underlying data.
// All changes are reversible via the mode flag.

import { ScenarioIntelligence } from "./buildScenarioMemo";
import { PhraseBank } from "./answerCrossScenarioQuestion";

export type PresentedIntelligence = ScenarioIntelligence;

export function presentIntelligence(
  intelligence: ScenarioIntelligence,
  mode: "operator" | "investor"
): PresentedIntelligence {
  if (mode === "operator") return intelligence;

  // Deep clone to avoid mutating original
  const clone: PresentedIntelligence = JSON.parse(JSON.stringify(intelligence));

  // Deterministic phrase-locked output for investor mode
  function phraseGuard(text: string): string {
    if (/[0-9$%mk]|million|billion|usd|eur|gbp|yen|dollar|euro|pound|percent/i.test(text)) {
      const isDev = (import.meta as any)?.env?.DEV === true;
      if (isDev) {
         
        console.error("PhraseBank guard: rejected bullet:", text);
      }
      return "Signal is directionally clear, but requires validation.";
    }
    return text;
  }

  clone.executiveSummary = PhraseBank.observationOpeners.slice(0, 2).map(phraseGuard);
  clone.keyObservations = PhraseBank.observationOpeners.slice(2, 4).map(phraseGuard);

  if (clone.riskSignals && clone.riskSignals.length > 0) {
    const topRisk = {
      severity: clone.riskSignals[0].severity,
      title: phraseGuard(PhraseBank.riskSignalTemplates[0]),
      driver: phraseGuard(PhraseBank.riskSignalTemplates[1]),
      impact: phraseGuard(PhraseBank.riskSignalTemplates[2]),
    };
    clone.riskSignals = [topRisk];
  }

  clone.leadershipAttention = PhraseBank.actionTemplates.slice(0, 3).map(phraseGuard);

  if (clone.strategicQA && clone.strategicQA.length > 0) {
    clone.strategicQA = clone.strategicQA.map((qa, i) => ({
      question: phraseGuard(qa.question),
      answer: phraseGuard(PhraseBank.crossScenarioConclusions[i % PhraseBank.crossScenarioConclusions.length]),
    }));
  }

  delete clone.assumptionFlags;
  return clone;
}
