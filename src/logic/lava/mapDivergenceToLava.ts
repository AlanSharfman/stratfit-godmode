// STRATFIT — Lava Mapping (Module 4)
// Map divergence deltas -> normalized lava intensity scalars.
// Pure + deterministic. No store reads.

export type Divergence = {
  survivalDeltaPp: number;      // +/- percentage points
  runwayDeltaMonths: number;    // +/- months
  arrDeltaP50: number;          // currency delta
  cashDeltaP50: number;         // currency delta
  arrSpreadDeltaPct: number;    // +/- %
  runwaySpreadDeltaPct: number; // +/- %
  scoreDelta: number;           // +/- score
};

export type LavaIntensity = {
  // 0..1
  overall: number;
  survival: number;
  runway: number;
  uncertainty: number;
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function normAbs(value: number, scale: number) {
  // maps |value| to 0..1 using a soft scale
  if (!Number.isFinite(value) || !Number.isFinite(scale) || scale <= 0) return 0;
  return clamp01(Math.abs(value) / scale);
}

/**
 * Default deterministic scaling:
 * - survival: 0..25pp
 * - runway: 0..12 months
 * - uncertainty: 0..50% spread delta
 * - score: 0..20 points (if your score is 0..100, adjust later)
 */
export function mapDivergenceToLava(div: Divergence): LavaIntensity {
  const survival = normAbs(div.survivalDeltaPp, 25);
  const runway = normAbs(div.runwayDeltaMonths, 12);

  const uncertaintyRaw = Math.max(
    normAbs(div.arrSpreadDeltaPct, 50),
    normAbs(div.runwaySpreadDeltaPct, 50)
  );

  // score is used as a stabilizer: if score delta is big, increase overall
  const score = normAbs(div.scoreDelta, 20);

  // overall is weighted: survival/runway dominate, uncertainty secondary, score booster
  const overall = clamp01(
    survival * 0.45 +
      runway * 0.35 +
      uncertaintyRaw * 0.20 +
      score * 0.15
  );

  return {
    overall,
    survival,
    runway,
    uncertainty: clamp01(uncertaintyRaw),
  };
}
