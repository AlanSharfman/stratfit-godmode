// src/core/store/useCommentaryStore.ts
// STRATFIT — Commentary Store
// Phase 8 AI Commentary Lock

import { create } from "zustand";
import { CommentaryResponse } from "@/core/ai/commentaryTypes";

interface CommentaryStore {
    commentary: CommentaryResponse | null;
    loading: boolean;
    setCommentary: (c: CommentaryResponse) => void;
    setLoading: (l: boolean) => void;
}

export const useCommentaryStore = create<CommentaryStore>((set) => ({
    commentary: null,
    loading: false,
    setCommentary: (commentary) => set({ commentary }),
    setLoading: (loading) => set({ loading }),
}));
