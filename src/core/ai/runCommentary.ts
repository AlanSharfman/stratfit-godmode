// src/core/ai/runCommentary.ts
// STRATFIT — Commentary Orchestrator
// Phase 8 AI Commentary Lock

import { useCanonicalOutputStore } from "@/core/store/useCanonicalOutputStore";
import { useCommentaryStore } from "@/core/store/useCommentaryStore";
import { fetchCommentary } from "./commentaryService";

export async function runCommentary(mode: "summary" | "detailed" = "summary") {
    const output = useCanonicalOutputStore.getState().output;
    if (!output) return;

    const { setCommentary, setLoading } = useCommentaryStore.getState();

    setLoading(true);
    const response = await fetchCommentary({ output, mode });
    setCommentary(response);
    setLoading(false);
}
