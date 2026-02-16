// src/core/ai/commentaryTypes.ts
// STRATFIT — Commentary Type Contract
// Phase 8 AI Commentary Lock

import type { CanonicalSimulationOutput } from "@/core/engines/simulation/canonicalOutput";

export interface CommentaryRequest {
    output: CanonicalSimulationOutput;
    mode: "summary" | "detailed";
}

export interface CommentaryResponse {
    text: string;
    bullets: string[];
    generatedAt: number;
}
