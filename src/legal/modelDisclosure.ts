// src/legal/modelDisclosure.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Canonical Legal Disclosure Text
//
// Single source of truth for all legal/disclaimer content.
// Used by LegalDisclosureAccordion and anywhere disclosure is needed.
// Tone: calm, professional, board-grade. No alarming language.
// ═══════════════════════════════════════════════════════════════════════════

export const MODEL_DISCLOSURE_SHORT =
  "Outputs are probabilistic estimates generated from your inputs and STRATFIT's modelling assumptions. They are indicative for planning and scenario comparison and do not constitute financial, legal, or investment advice.";

export const MODEL_DISCLOSURE_LONG =
  "STRATFIT produces probabilistic scenario outputs based on user-provided inputs, statistical simulation, and model assumptions. Results are indicative and intended to support strategic planning, risk awareness, and comparative scenario analysis. Outputs are not a guarantee of future performance and should not be relied upon as the sole basis for decisions. Validate inputs, review assumptions, and seek advice from qualified professionals (finance, legal, tax, investment) before acting.";

export const MODEL_ASSUMPTIONS_BULLETS: string[] = [
  "Inputs are accurate, complete, and internally consistent (units, timeframes).",
  "Model uses statistical sampling and may simplify real-world dynamics.",
  "Market conditions and execution factors can change materially.",
  "Where distributions are displayed, percentile bands (p25\u2013p75 etc.) are used; outliers may be winsorised for stability.",
  "Simulation settings (iterations, horizon, seed) affect precision and repeatability.",
];






