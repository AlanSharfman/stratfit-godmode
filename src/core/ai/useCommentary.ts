// src/core/ai/useCommentary.ts
// STRATFIT — Commentary Hook
// Phase 8 AI Commentary Lock

import { useEffect } from "react";
import { runCommentary } from "./runCommentary";
import { useCommentaryStore } from "@/core/store/useCommentaryStore";

export function useCommentary() {
    const commentary = useCommentaryStore((s) => s.commentary);
    const loading = useCommentaryStore((s) => s.loading);

    useEffect(() => {
        runCommentary("summary");
    }, []);

    return { commentary, loading };
}
