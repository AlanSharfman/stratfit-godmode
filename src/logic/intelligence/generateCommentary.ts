// src/logic/intelligence/generateCommentary.ts
// ═══════════════════════════════════════════════════════════════════════════
// LEGACY — REPLACED
//
// This file previously generated commentary from raw store types
// (MonteCarloResult, Verdict, EngineResult, etc.)
//
// It has been superseded by the snapshot-driven pipeline:
//   extractQuantifiedFindings.ts → generateNarrative.ts
//
// Both new modules consume SystemAnalysisSnapshot ONLY.
//
// This file is retained as a re-export bridge for any remaining imports.
// New code should import from extractQuantifiedFindings / generateNarrative.
// ═══════════════════════════════════════════════════════════════════════════

// Re-export the new pipeline types for backward compat
export type { QuantifiedFinding as CommentaryBlock } from "./extractQuantifiedFindings";
export type { NarrativeOutput as CommentaryOutput } from "./generateNarrative";

// Stub for any remaining callers — returns empty output
export interface CommentaryInput {
  [key: string]: unknown;
}

export function generateCommentary(_input: CommentaryInput): { source: "empty"; blocks: never[] } {
  console.warn("[generateCommentary] LEGACY CALL — use extractQuantifiedFindings + generateNarrative instead.");
  return { source: "empty", blocks: [] };
}
