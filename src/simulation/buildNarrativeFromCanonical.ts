// STRATFIT — Canonical Narrative Builder
// Pure function — no React, no stores, deterministic.

export interface NarrativeBlock {
  headline: string;
  summary: string;
  riskCommentary: string;
  valuationCommentary: string;
}

export function buildNarrativeFromCanonical(input: {
  survivalProbability?: number;
  confidenceIndex?: number;
  runwayMonths?: number;
  volatility?: number;
  valuationLow?: number;
  valuationHigh?: number;
  valuationP50?: number;
}): NarrativeBlock {
  const survival = input.survivalProbability ?? 0;
  const confidence = input.confidenceIndex ?? 0;
  const runway = input.runwayMonths ?? 0;
  const volatility = input.volatility ?? 0;

  const riskLevel =
    survival > 0.7 ? "low" :
    survival > 0.45 ? "moderate" :
    "elevated";

  const stability =
    confidence > 0.7 ? "stable" :
    confidence > 0.45 ? "variable" :
    "uncertain";

  return {
    headline: `Scenario outlook is ${riskLevel} risk with ${stability} execution stability.`,

    summary:
      `The model indicates a ${Math.round(survival * 100)}% survival probability over the projected horizon, ` +
      `with an estimated runway of ${Math.round(runway)} months.`,

    riskCommentary:
      `Volatility is currently ${Math.round(volatility * 100)}%, suggesting ` +
      (volatility > 0.6 ? "material sensitivity to execution and market factors." :
       volatility > 0.35 ? "moderate variability across outcomes." :
       "a relatively contained outcome range."),

    valuationCommentary:
      input.valuationP50
        ? `The central valuation estimate is ${formatCurrency(input.valuationP50)}, ` +
          `with a probabilistic range between ${formatCurrency(input.valuationLow)} and ${formatCurrency(input.valuationHigh)}.`
        : "Valuation data not available.",
  };
}

function formatCurrency(v?: number) {
  if (!v && v !== 0) return "—";
  return `$${Math.round(v).toLocaleString()}`;
}
