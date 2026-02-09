// src/logic/valuation/summarizeValuationDistribution.ts
// STRATFIT — Canonical Valuation Distribution Summariser
// Converts raw EV samples (or pre-computed percentiles) into a decision-grade
// percentile summary with winsorisation and probability thresholds.
//
// This is a PURE function. No side effects. No store dependencies.

// ============================================================================
// TYPES
// ============================================================================

export interface PercentileInput {
  p5?: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95?: number;
}

export interface ProbabilityThreshold {
  label: string;
  value: number;
  probability: number; // 0–1
  direction: "ge" | "le"; // ≥ or ≤
}

export interface ValuationDistributionSummary {
  // ── Core percentiles (winsorised display range) ──
  p10: number;
  p25: number;
  p50: number; // HEADLINE number
  p75: number;
  p90: number;

  // ── Winsorisation bounds (for clamping outlier display) ──
  winsorLow: number; // p5 or computed
  winsorHigh: number; // p95 or computed

  // ── Probability thresholds ──
  probabilities: ProbabilityThreshold[];

  // ── Metadata ──
  sampleCount: number;
  isFromRealDistribution: boolean; // true = Monte Carlo, false = synthetic
  winsorisationApplied: boolean;
  displayUnit: "USD";
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default probability thresholds (editable by user later) */
const DEFAULT_GE_THRESHOLDS = [25_000_000, 40_000_000, 60_000_000]; // EV ≥ $X
const DEFAULT_LE_THRESHOLDS = [15_000_000, 10_000_000]; // EV ≤ $Y

// ============================================================================
// HELPERS
// ============================================================================

function percentileFromSorted(sorted: number[], p: number): number {
  const n = sorted.length;
  if (n === 0) return 0;
  const idx = Math.max(0, Math.min(n - 1, Math.floor((p / 100) * n)));
  return sorted[idx];
}

function winsorise(sorted: number[], lowP: number, highP: number): number[] {
  const n = sorted.length;
  if (n === 0) return [];
  const lo = sorted[Math.max(0, Math.floor((lowP / 100) * n))];
  const hi = sorted[Math.min(n - 1, Math.floor((highP / 100) * n))];
  return sorted.map((v) => Math.max(lo, Math.min(hi, v)));
}

/** Estimate probability P(X ≥ threshold) from sorted samples */
function probGe(sorted: number[], threshold: number): number {
  const n = sorted.length;
  if (n === 0) return 0;
  const count = sorted.filter((v) => v >= threshold).length;
  return count / n;
}

/** Estimate probability P(X ≤ threshold) from sorted samples */
function probLe(sorted: number[], threshold: number): number {
  const n = sorted.length;
  if (n === 0) return 0;
  const count = sorted.filter((v) => v <= threshold).length;
  return count / n;
}

/**
 * Derive synthetic percentiles from a single valuation and its method-specific
 * uncertainty factor. Used when no Monte Carlo distribution is available.
 */
function syntheticPercentiles(
  midEV: number,
  uncertainty: number // 0.15 = ±15% for p25/p75, scaled for wider bands
): PercentileInput {
  return {
    p5: midEV * (1 - uncertainty * 2.5),
    p10: midEV * (1 - uncertainty * 2.0),
    p25: midEV * (1 - uncertainty),
    p50: midEV,
    p75: midEV * (1 + uncertainty),
    p90: midEV * (1 + uncertainty * 2.0),
    p95: midEV * (1 + uncertainty * 2.5),
  };
}

/**
 * Given sorted samples, compute probability thresholds.
 * Automatically chooses sensible thresholds near the p50 if defaults are out of range.
 */
function computeProbabilities(
  sorted: number[],
  geThresholds: number[],
  leThresholds: number[]
): ProbabilityThreshold[] {
  const probs: ProbabilityThreshold[] = [];

  for (const t of geThresholds) {
    probs.push({
      label: `EV ≥ ${fmtCompact(t)}`,
      value: t,
      probability: probGe(sorted, t),
      direction: "ge",
    });
  }

  for (const t of leThresholds) {
    probs.push({
      label: `EV ≤ ${fmtCompact(t)}`,
      value: t,
      probability: probLe(sorted, t),
      direction: "le",
    });
  }

  return probs;
}

function fmtCompact(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(0)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

// ============================================================================
// MAIN FUNCTION — from raw samples
// ============================================================================

/**
 * Summarise a valuation distribution from raw EV samples (preferred — Monte Carlo).
 *
 * @param samples  Array of enterprise value samples (e.g. 10,000 EV values)
 * @param options  Optional: custom probability thresholds
 */
export function summarizeFromSamples(
  samples: number[],
  options?: {
    geThresholds?: number[];
    leThresholds?: number[];
  }
): ValuationDistributionSummary {
  if (samples.length < 10) {
    // Insufficient data — return empty/zeroed summary
    return {
      p10: 0,
      p25: 0,
      p50: 0,
      p75: 0,
      p90: 0,
      winsorLow: 0,
      winsorHigh: 0,
      probabilities: [],
      sampleCount: samples.length,
      isFromRealDistribution: false,
      winsorisationApplied: false,
      displayUnit: "USD",
    };
  }

  // Winsorise at p5/p95 to prevent insane bands
  const sorted = [...samples].sort((a, b) => a - b);
  const winsorised = winsorise(sorted, 5, 95);
  const winSorted = [...winsorised].sort((a, b) => a - b);

  const p5 = percentileFromSorted(sorted, 5);
  const p95 = percentileFromSorted(sorted, 95);

  // Derive sensible probability thresholds near the median
  const p50 = percentileFromSorted(winSorted, 50);
  const geThresholds = options?.geThresholds ?? autoProbThresholds(p50, "ge");
  const leThresholds = options?.leThresholds ?? autoProbThresholds(p50, "le");

  return {
    p10: percentileFromSorted(winSorted, 10),
    p25: percentileFromSorted(winSorted, 25),
    p50,
    p75: percentileFromSorted(winSorted, 75),
    p90: percentileFromSorted(winSorted, 90),
    winsorLow: p5,
    winsorHigh: p95,
    probabilities: computeProbabilities(sorted, geThresholds, leThresholds),
    sampleCount: samples.length,
    isFromRealDistribution: true,
    winsorisationApplied: true,
    displayUnit: "USD",
  };
}

// ============================================================================
// MAIN FUNCTION — from pre-computed percentiles
// ============================================================================

/**
 * Summarise a valuation distribution from pre-computed percentiles.
 * Used when raw samples are not available (e.g. persisted assessment payload).
 * Probabilities are estimated using a normal approximation.
 *
 * @param pctls  Pre-computed percentile set
 */
export function summarizeFromPercentiles(
  pctls: PercentileInput
): ValuationDistributionSummary {
  // Estimate sigma from IQR (p75 - p25 ≈ 1.35σ for normal)
  const iqr = pctls.p75 - pctls.p25;
  const sigma = iqr > 0 ? iqr / 1.35 : pctls.p50 * 0.2;
  const mu = pctls.p50;

  // Winsor bounds
  const winsorLow = pctls.p5 ?? mu - 2.5 * sigma;
  const winsorHigh = pctls.p95 ?? mu + 2.5 * sigma;

  // Generate synthetic samples for probability calculation
  const syntheticSamples = generateNormalSamples(mu, sigma, 5000, winsorLow, winsorHigh);
  const sorted = syntheticSamples.sort((a, b) => a - b);

  const geThresholds = autoProbThresholds(mu, "ge");
  const leThresholds = autoProbThresholds(mu, "le");

  return {
    p10: pctls.p10,
    p25: pctls.p25,
    p50: pctls.p50,
    p75: pctls.p75,
    p90: pctls.p90,
    winsorLow,
    winsorHigh,
    probabilities: computeProbabilities(sorted, geThresholds, leThresholds),
    sampleCount: 0, // Not from real samples
    isFromRealDistribution: false,
    winsorisationApplied: true,
    displayUnit: "USD",
  };
}

// ============================================================================
// MAIN FUNCTION — from a single valuation (fallback)
// ============================================================================

/**
 * Generate a synthetic distribution from a single EV number.
 * Used when no simulation has been run. Documents assumptions.
 *
 * @param ev  Single enterprise value estimate
 * @param uncertainty  Fractional uncertainty (0.15 = ±15% for p25/p75). Default 0.20.
 */
export function summarizeFromSingleEV(
  ev: number,
  uncertainty: number = 0.20
): ValuationDistributionSummary {
  const pctls = syntheticPercentiles(ev, uncertainty);
  const result = summarizeFromPercentiles(pctls);
  return {
    ...result,
    isFromRealDistribution: false,
    sampleCount: 0,
  };
}

// ============================================================================
// HELPER: generate approximate probability thresholds near median
// ============================================================================

function autoProbThresholds(median: number, dir: "ge" | "le"): number[] {
  // Round to a "clean" number near median
  const mag = Math.pow(10, Math.floor(Math.log10(Math.max(median, 1))));
  const round = (v: number) => Math.round(v / mag) * mag;

  if (dir === "ge") {
    return [
      round(median * 0.8),
      round(median * 1.0),
      round(median * 1.3),
    ].filter((v) => v > 0);
  }
  return [
    round(median * 0.6),
    round(median * 0.4),
  ].filter((v) => v > 0);
}

// ============================================================================
// HELPER: generate pseudo-normal samples (for probability estimation)
// ============================================================================

function generateNormalSamples(
  mu: number,
  sigma: number,
  n: number,
  minClamp: number,
  maxClamp: number
): number[] {
  const samples: number[] = [];
  for (let i = 0; i < n; i++) {
    // Box-Muller (deterministic seed not needed — this is for display-only probability estimation)
    const u1 = (i + 1) / (n + 1); // uniform sequence (no Math.random for reproducibility)
    const u2 = ((i * 7919 + 1) % (n + 1)) / (n + 1); // quasi-random
    const z = Math.sqrt(-2 * Math.log(Math.max(1e-10, u1))) * Math.cos(2 * Math.PI * u2);
    const sample = mu + z * sigma;
    samples.push(Math.max(minClamp, Math.min(maxClamp, sample)));
  }
  return samples;
}

// ============================================================================
// SANE BOUNDS — Method-specific caps to prevent outlier multiples
// ============================================================================

export interface SaneBounds {
  maxARRMultiple: number;
  minARRMultiple: number;
  maxRevenueMultiple: number;
  minRevenueMultiple: number;
  maxDCFTerminalGrowth: number;
  minDiscountRate: number;
  maxDiscountRate: number;
}

/** Returns method-specific sane bounds to cap extreme multiples */
export function getSaneBounds(
  stage: string
): SaneBounds {
  // More mature stages get tighter bounds
  const isEarly = stage === "pre-seed" || stage === "seed";
  return {
    maxARRMultiple: isEarly ? 50 : 30,
    minARRMultiple: 1,
    maxRevenueMultiple: isEarly ? 40 : 20,
    minRevenueMultiple: 0.5,
    maxDCFTerminalGrowth: 5.0, // %
    minDiscountRate: 8.0, // %
    maxDiscountRate: 25.0, // %
  };
}

/** Clamp a multiple within sane bounds */
export function clampMultiple(
  multiple: number,
  min: number,
  max: number
): number {
  return Math.max(min, Math.min(max, multiple));
}

// ============================================================================
// EXPORT HELPERS
// ============================================================================

export { fmtCompact };

