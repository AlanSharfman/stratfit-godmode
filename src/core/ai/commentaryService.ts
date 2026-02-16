// src/core/ai/commentaryService.ts
// STRATFIT — AI Commentary Service
// Phase 8 AI Commentary Lock

import { buildCommentaryPrompt } from "./buildCommentaryPrompt";
import { CommentaryRequest, CommentaryResponse } from "./commentaryTypes";

export async function fetchCommentary(req: CommentaryRequest): Promise<CommentaryResponse> {
    const prompt = buildCommentaryPrompt(req);

    // provider integration point (OpenAI, etc.)
    const res = await fetch("/api/commentary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
    });

    const data = await res.json();

    return {
        text: data.text,
        bullets: data.bullets ?? [],
        generatedAt: Date.now(),
    };
}
