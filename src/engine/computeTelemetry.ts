// src/engine/computeTelemetry.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Platform-Wide Compute Telemetry Bus
//
// LEGAL GUARDRAIL: This module must only emit real compute lifecycle events.
// Never fabricate progress. No fake percentages. No staged delays.
// No typing theatre. Only instrument at actual function boundaries.
// ═══════════════════════════════════════════════════════════════════════════

// ── Job Types — every real compute pipeline in STRATFIT ──────────────────

export type ComputeJob =
  | "baseline_compile"
  | "strategy_compile"
  | "terrain_simulation"
  | "compare_delta"
  | "risk_scoring"
  | "valuation_dcf"
  | "valuation_comps"
  | "valuation_multiples"
  | "decision_synthesis"
  | "report_pack_generate"
  | "data_import"
  | "render_prepare"
  | "cache_rebuild"
  | "custom";

// ── Step Types — real function boundaries only ───────────────────────────

export type ComputeStep =
  | "initialize"
  | "load_inputs"
  | "validate"
  | "normalize"
  | "derive_metrics"
  | "prepare_model"
  | "run_model"
  | "aggregate"
  | "postprocess"
  | "render"
  | "persist"
  | "complete"
  | "error";

// ── Meta — optional, only if factual ─────────────────────────────────────

export type ComputeMeta = {
  iterations?: number;
  scenarios?: number;
  rows?: number;
  durationMs?: number;
  methodName?: string;     // e.g. "Monte Carlo", "DCF"
  target?: string;         // e.g. "Terrain", "Compare", "Decision"
  note?: string;           // MUST be factual, not marketing
};

// ── Event ────────────────────────────────────────────────────────────────

export type ComputeEvent = {
  job: ComputeJob;
  step: ComputeStep;
  meta?: ComputeMeta;
  ts: number;
};

// ── Internal Bus — minimal pub/sub ───────────────────────────────────────

type Listener = (evt: ComputeEvent) => void;

const listeners = new Set<Listener>();

export const computeBus = {
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },

  emit(evt: ComputeEvent): void {
    listeners.forEach((fn) => {
      try { fn(evt); } catch { /* swallow — telemetry must never crash the app */ }
    });
  },
};

// ── Convenience emitter ──────────────────────────────────────────────────

export function emitCompute(
  job: ComputeJob,
  step: ComputeStep,
  meta?: ComputeMeta
): void {
  computeBus.emit({ job, step, meta, ts: performance.now() });
}





