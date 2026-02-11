// src/logic/confidence/modelConfidence.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Grounded Model Confidence Calculator
//
// Mathematically derived from measurable signals:
//   (a) simulation sample size
//   (b) distribution tightness (relative IQR)
//   (c) input completeness (baseline field coverage)
//   (d) model stability (seeded determinism + no NaNs)
//   (e) method blending penalty
//
// Bands: VERY_LOW | LOW | MEDIUM | HIGH | VERY_HIGH
// ═══════════════════════════════════════════════════════════════════════════

// ────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────

export type ConfidenceBand = "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export interface ConfidenceInputs {
  iterations: number;
  samplesCount?: number;        // if valuation provides samples
  p25?: number;
  p50?: number;
  p75?: number;
  p10?: number;
  p90?: number;
  hasNaN: boolean;
  baselineCompleteness01: number; // 0..1
  methodCountUsed: number;        // e.g. 1 if only STRATFIT engine, 2+ if blended
  horizonMonths?: number;
}

export interface ConfidenceMetrics {
  iterationsScore01: number;
  tightnessScore01: number;
  completenessScore01: number;
  stabilityScore01: number;
  methodPenalty01: number;
}

export interface ConfidenceResult {
  band: ConfidenceBand;
  score01: number;            // 0..1 — internal; UI shows band + subtle bar
  reasons: string[];          // 3–6 short bullet reasons for tooltip
  metrics: ConfidenceMetrics;
}

// ────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────────────────

const EPSILON = 1e-9;

const W_ITERATIONS    = 0.30;
const W_TIGHTNESS     = 0.30;
const W_COMPLETENESS  = 0.30;
const W_STABILITY     = 0.10;

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT SCORES
// ────────────────────────────────────────────────────────────────────────────

/** Iteration-based score: more runs = higher statistical stability */
export function scoreIterations(n: number): number {
  if (n >= 10_000) return 1.00;
  if (n >= 5_000) return 0.85;
  if (n >= 2_000) return 0.65;
  if (n >= 500)   return 0.40;
  return 0.20;
}

/** Distribution tightness from relative IQR = (p75 - p25) / |p50| */
export function scoreTightness(p25?: number, p50?: number, p75?: number): number {
  if (p25 == null || p50 == null || p75 == null) return 0.50; // unknown → neutral
  const iqr = p75 - p25;
  const relIQR = iqr / Math.max(Math.abs(p50), EPSILON);
  if (relIQR <= 0.20) return 1.00;
  if (relIQR <= 0.35) return 0.75;
  if (relIQR <= 0.60) return 0.50;
  if (relIQR <= 1.00) return 0.25;
  return 0.15;
}

/** Method blending penalty */
export function penaltyMethods(methodCount: number): number {
  if (methodCount <= 1) return 0;
  if (methodCount === 2) return 0.05;
  if (methodCount === 3) return 0.10;
  return 0.15;
}

// ────────────────────────────────────────────────────────────────────────────
// BAND MAPPING
// ────────────────────────────────────────────────────────────────────────────

function toBand(score01: number): ConfidenceBand {
  if (score01 >= 0.85) return "VERY_HIGH";
  if (score01 >= 0.70) return "HIGH";
  if (score01 >= 0.50) return "MEDIUM";
  if (score01 >= 0.30) return "LOW";
  return "VERY_LOW";
}

// ────────────────────────────────────────────────────────────────────────────
// REASONS BUILDER
// ────────────────────────────────────────────────────────────────────────────

function buildReasons(inputs: ConfidenceInputs, metrics: ConfidenceMetrics): string[] {
  const reasons: string[] = [];

  // Iterations
  const n = inputs.iterations;
  if (n >= 10_000)      reasons.push(`${n.toLocaleString()} runs (high statistical stability)`);
  else if (n >= 5_000)  reasons.push(`${n.toLocaleString()} runs (good stability)`);
  else if (n >= 2_000)  reasons.push(`${n.toLocaleString()} runs (moderate stability)`);
  else if (n >= 500)    reasons.push(`${n.toLocaleString()} runs (limited stability — consider more iterations)`);
  else                  reasons.push(`${n.toLocaleString()} runs (low — increase to ≥1,000 for reliability)`);

  // Tightness
  if (inputs.p25 != null && inputs.p50 != null && inputs.p75 != null) {
    const iqr = inputs.p75 - inputs.p25;
    const relPct = Math.round((iqr / Math.max(Math.abs(inputs.p50), EPSILON)) * 100);
    if (relPct <= 20)       reasons.push(`Tight operating band (IQR ${relPct}% of median)`);
    else if (relPct <= 35)  reasons.push(`Moderate operating band (IQR ${relPct}% of median)`);
    else if (relPct <= 60)  reasons.push(`Wide operating band (IQR ${relPct}% of median)`);
    else                    reasons.push(`Very wide band (IQR ${relPct}% of median) — high uncertainty`);
  } else {
    reasons.push("Distribution tightness unavailable");
  }

  // Completeness
  const compPct = Math.round(inputs.baselineCompleteness01 * 100);
  if (compPct >= 90)      reasons.push(`Baseline completeness ${compPct}%`);
  else if (compPct >= 70) reasons.push(`Baseline completeness ${compPct}% — some fields missing`);
  else                    reasons.push(`Baseline completeness ${compPct}% — incomplete inputs reduce confidence`);

  // Stability
  if (inputs.hasNaN) {
    reasons.push("Invalid outputs detected (NaN) — model instability");
  } else {
    reasons.push("No invalid outputs detected");
  }

  // Method penalty
  if (inputs.methodCountUsed > 1) {
    reasons.push(`Blended methods (${inputs.methodCountUsed}): small uncertainty penalty`);
  }

  return reasons;
}

// ────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ────────────────────────────────────────────────────────────────────────────

export function computeConfidence(inputs: ConfidenceInputs): ConfidenceResult {
  const iterationsScore01  = scoreIterations(inputs.iterations);
  const tightnessScore01   = scoreTightness(inputs.p25, inputs.p50, inputs.p75);
  const completenessScore01 = Math.max(0, Math.min(1, inputs.baselineCompleteness01));
  const stabilityScore01   = inputs.hasNaN ? 0.0 : 1.0;
  const methodPenalty01    = penaltyMethods(inputs.methodCountUsed);

  const raw =
    W_ITERATIONS   * iterationsScore01 +
    W_TIGHTNESS    * tightnessScore01 +
    W_COMPLETENESS * completenessScore01 +
    W_STABILITY    * stabilityScore01 -
    methodPenalty01;

  const score01 = Math.max(0, Math.min(1, raw));
  const band = toBand(score01);

  const metrics: ConfidenceMetrics = {
    iterationsScore01,
    tightnessScore01,
    completenessScore01,
    stabilityScore01,
    methodPenalty01,
  };

  const reasons = buildReasons(inputs, metrics);

  return { band, score01, reasons, metrics };
}






