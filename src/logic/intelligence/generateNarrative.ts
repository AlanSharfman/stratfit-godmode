// src/logic/intelligence/generateNarrative.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Narrative Generator
//
// Two modes:
//   1. Deterministic (default): returns findings as-is in structured format.
//   2. OpenAI-enhanced (future): sends quantified findings only; instructs model
//      to preserve numeric values and citations exactly.
//
// RULES:
//   • No store imports. Pure function.
//   • Never alters numeric values.
//   • Never invents data.
//   • Preserves citations verbatim.
// ═══════════════════════════════════════════════════════════════════════════

import type { QuantifiedFinding, Citation } from "./extractQuantifiedFindings";

// ============================================================================
// TYPES
// ============================================================================

export interface NarrativeBlock {
  id: string;
  category: QuantifiedFinding["category"];
  severity: QuantifiedFinding["severity"];
  title: string;
  claim: string;
  citations: Citation[];
}

export interface NarrativeOutput {
  source: "deterministic" | "openai";
  blocks: NarrativeBlock[];
}

// ============================================================================
// CONFIG
// ============================================================================

/** Set to true when OpenAI integration is wired */
const OPENAI_ENABLED = false;

const CATEGORY_TITLES: Record<QuantifiedFinding["category"], string> = {
  survival: "Survival Posture",
  revenue: "Revenue Distribution",
  capital: "Capital Position",
  runway: "Runway Horizon",
  sensitivity: "Key Sensitivity Drivers",
  risk: "Risk Assessment",
  valuation: "Valuation Signal",
  confidence: "Model Confidence",
};

// ============================================================================
// DETERMINISTIC NARRATIVE
// ============================================================================

function deterministicNarrative(findings: QuantifiedFinding[]): NarrativeOutput {
  const blocks: NarrativeBlock[] = findings.map((f) => ({
    id: f.id,
    category: f.category,
    severity: f.severity,
    title: CATEGORY_TITLES[f.category] ?? f.category,
    claim: f.narrative,
    citations: f.citations,
  }));

  return { source: "deterministic", blocks };
}

// ============================================================================
// OPENAI NARRATIVE (STUB — future integration)
// ============================================================================

/**
 * When OpenAI is enabled, this function sends the quantified findings
 * to the model with strict instructions:
 *   - "Do not alter numeric values."
 *   - "Do not invent data."
 *   - "Preserve citations exactly."
 *   - "Return structured JSON matching NarrativeBlock[]."
 *
 * For now, falls back to deterministic.
 */
async function openAINarrative(findings: QuantifiedFinding[]): Promise<NarrativeOutput> {
  // ── SYSTEM PROMPT (for future use) ──
  const _systemPrompt = `You are a financial analysis narrator for STRATFIT.
You receive quantified findings from a Monte Carlo simulation analysis.
Your role is to synthesize these into a concise institutional narrative.

STRICT RULES:
1. Do NOT alter any numeric values. Use them verbatim.
2. Do NOT invent data points not present in the findings.
3. Preserve all citations exactly as provided.
4. Use institutional tone — no hype, no emojis, no marketing language.
5. Each block must reference specific numbers from the citations.
6. Return valid JSON matching the NarrativeBlock[] schema.`;

  // ── FALLBACK: deterministic until OpenAI is wired ──
  console.info("[generateNarrative] OpenAI integration pending. Using deterministic narrative.");
  return deterministicNarrative(findings);
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export function generateNarrative(findings: QuantifiedFinding[]): NarrativeOutput {
  if (findings.length === 0) {
    return { source: "deterministic", blocks: [] };
  }

  if (OPENAI_ENABLED) {
    // OpenAI path is async but we return sync for now.
    // When enabled, the component should call generateNarrativeAsync instead.
    return deterministicNarrative(findings);
  }

  return deterministicNarrative(findings);
}

/**
 * Async version for when OpenAI is enabled.
 * Components can call this and handle the promise.
 */
export async function generateNarrativeAsync(findings: QuantifiedFinding[]): Promise<NarrativeOutput> {
  if (findings.length === 0) {
    return { source: "deterministic", blocks: [] };
  }

  if (OPENAI_ENABLED) {
    return openAINarrative(findings);
  }

  return deterministicNarrative(findings);
}

