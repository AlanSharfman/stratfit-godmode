// src/engine/provenanceContract.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Provenance Contract
//
// Canonical provenance constants and helpers.
// Every module page can import ENGINE_VERSION and computeInputsHash()
// to display a provenance badge and gate rendering.
//
// ARCHITECTURE RULE:
//   Provenance is metadata ABOUT a simulation run. It does not compute
//   business metrics. It exists to ensure traceability and prevent
//   stale/mismatched data from rendering.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Current engine version. Bump on any change to simulation logic.
 * Format: MAJOR.MINOR.PATCH
 */
export const ENGINE_VERSION = "3.0.0" as const;

/**
 * Provenance metadata for a simulation run.
 */
export interface ProvenanceSnapshot {
  runId: string | number | null;
  engineVersion: string;
  seed: number | null;
  inputsHash: string | null;
  completedAt: number | null;
}

/**
 * Compute a deterministic hash of simulation inputs.
 * Uses djb2 algorithm — fast, no dependencies.
 */
export function computeInputsHash(inputs: Record<string, unknown>): string {
  const raw = JSON.stringify(inputs, Object.keys(inputs).sort());
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash + raw.charCodeAt(i)) | 0;
  }
  // Convert to positive hex string
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * Empty provenance snapshot — used as safe default when no run exists.
 */
export const EMPTY_PROVENANCE: ProvenanceSnapshot = Object.freeze({
  runId: null,
  engineVersion: ENGINE_VERSION,
  seed: null,
  inputsHash: null,
  completedAt: null,
});
