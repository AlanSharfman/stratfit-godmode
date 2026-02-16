// src/core/ai/buildCommentaryPrompt.ts
// STRATFIT — Commentary Prompt Builder
// Phase 8 AI Commentary Lock

import { CommentaryRequest } from "./commentaryTypes";

export function buildCommentaryPrompt(req: CommentaryRequest) {
    const o = req.output;

    return `
You are a strategic analytics narrator.

Rules:
• Interpret only — do not advise actions
• Reference probabilities explicitly
• Be concise and neutral
• Do not speculate beyond provided metrics

Metrics:
Survival Probability: ${(o.simulation.survivalProbability * 100).toFixed(1)}%
Confidence Index: ${(o.simulation.confidenceIndex * 100).toFixed(1)}%
Runway Months: ${o.liquidity.runwayMonths}
Valuation Range: ${Math.round(o.valuation.probabilityBandLow / 1e6)}M–${Math.round(
        o.valuation.probabilityBandHigh / 1e6
    )}M

Return:
1 short paragraph
3 bullet observations
`;
}
