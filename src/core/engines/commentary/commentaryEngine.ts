// src/core/engines/commentary/commentaryEngine.ts
// STRATFIT — Commentary Engine (Interpretation Only, Probability-Aware)
// Phase 5 Simulation Orchestration Lock

export function generateCommentary(params: {
    survivalProbability: number;
    runwayMonths: number;
    confidenceIndex: number;
}) {
    const { survivalProbability, runwayMonths, confidenceIndex } = params;

    let mode: "neutral" | "caution" | "opportunity" = "neutral";
    if (survivalProbability < 0.55 || runwayMonths < 9) mode = "caution";
    if (survivalProbability > 0.75 && confidenceIndex > 0.8) mode = "opportunity";

    const bullets: string[] = [
        `Survival probability is ${(survivalProbability * 100).toFixed(0)}% over the modeled horizon.`,
        `Runway is modeled at ~${Math.max(0, runwayMonths)} months (median path).`,
        `Decision confidence index is ${(confidenceIndex * 100).toFixed(0)}% given current volatility.`,
    ];

    return { mode, bullets };
}
