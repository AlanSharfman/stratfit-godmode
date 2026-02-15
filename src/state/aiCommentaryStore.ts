import { create } from "zustand";

/**
 * AI Commentary Store - Stores AI-generated strategic commentary
 * that reacts to trajectory divergence and scenario changes.
 */
type CommentaryState = {
  message: string;
  severity: "info" | "caution" | "alert";
  timestamp: number;

  setMessage: (m: string, severity?: "info" | "caution" | "alert") => void;
  clear: () => void;
};

export const useAICommentaryStore = create<CommentaryState>((set) => ({
  message: "",
  severity: "info",
  timestamp: Date.now(),

  setMessage: (m, severity = "info") =>
    set({ message: m, severity, timestamp: Date.now() }),
  clear: () => set({ message: "", severity: "info" }),
}));
