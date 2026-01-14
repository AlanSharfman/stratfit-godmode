// src/logic/qualityScore.ts
// STRATFIT — Single Source of Truth for Quality Score
//
// CANONICAL FORMULA (locked):
//   qualityScore =
//     0.35 * normalize(ltvCac, 2 → 6)
//   + 0.25 * normalize(payback, 36 → 6)   // inverted (lower is better)
//   + 0.25 * normalize(earningsPower, 20 → 80)
//   + 0.15 * normalize(burnQuality, 20 → 80)
//
// BANDS:
//   ≥ 0.7  → Green  (Institutional quality)
//   0.4–0.7 → Amber  (Fragile but improvable)
//   < 0.4  → Red    (Economically broken)

import type { EngineResult } from "@/state/scenarioStore";

export type QualityBand = "green" | "amber" | "red";

/**
 * Normalize a value to 0–1 range.
 * @param x - The value to normalize
 * @param min - The minimum threshold (maps to 0)
 * @param max - The maximum threshold (maps to 1)
 */
function normalize(x: number, min: number, max: number): number {
  if (!Number.isFinite(x)) return 0.5; // Safe fallback
  return Math.max(0, Math.min(1, (x - min) / (max - min)));
}

/**
 * Inverted normalize — for metrics where lower is better (e.g., payback months).
 */
function normalizeInverted(x: number, min: number, max: number): number {
  return 1 - normalize(x, min, max);
}

/**
 * Returns the composite quality score (0–1) where HIGHER = BETTER.
 * This is the ONLY function that should be used to compute quality in the UI.
 *
 * Components:
 * - LTV/CAC (35%): 2x = 0, 6x = 1
 * - CAC Payback (25%): 36mo = 0, 6mo = 1 (inverted)
 * - Earnings Power / Gross Margin (25%): 20% = 0, 80% = 1
 * - Burn Quality (15%): 20 = 0, 80 = 1
 *
 * @param engineResult - The engine result containing kpis
 * @returns Quality score (0–1), higher = better
 */
export function getQualityScore(engineResult: EngineResult | null | undefined): number {
  const kpis = engineResult?.kpis;
  if (!kpis) return 0.5; // Neutral fallback

  const ltvCac = kpis.ltvCac?.value ?? 3;
  const cacPayback = kpis.cacPayback?.value ?? 18;
  const earningsPower = kpis.earningsPower?.value ?? 50;
  const burnQuality = kpis.burnQuality?.value ?? 50;

  const score =
    0.35 * normalize(ltvCac, 2, 6) +
    0.25 * normalizeInverted(cacPayback, 6, 36) +
    0.25 * normalize(earningsPower, 20, 80) +
    0.15 * normalize(burnQuality, 20, 80);

  return Math.round(score * 100) / 100; // Round to 2 decimal places
}

/**
 * Returns the quality score from raw KPIs object.
 * Use when you have kpis directly instead of full engineResult.
 */
export function getQualityScoreFromKpis(
  kpis: Record<string, { value: number; display: string }> | null | undefined
): number {
  if (!kpis) return 0.5;

  const ltvCac = kpis.ltvCac?.value ?? 3;
  const cacPayback = kpis.cacPayback?.value ?? 18;
  const earningsPower = kpis.earningsPower?.value ?? 50;
  const burnQuality = kpis.burnQuality?.value ?? 50;

  const score =
    0.35 * normalize(ltvCac, 2, 6) +
    0.25 * normalizeInverted(cacPayback, 6, 36) +
    0.25 * normalize(earningsPower, 20, 80) +
    0.15 * normalize(burnQuality, 20, 80);

  return Math.round(score * 100) / 100;
}

/**
 * Returns the quality band for color coding.
 * - "green": ≥ 0.7 (Institutional quality)
 * - "amber": 0.4 – 0.7 (Fragile but improvable)
 * - "red": < 0.4 (Economically broken)
 */
export function getQualityBand(engineResult: EngineResult | null | undefined): QualityBand {
  const score = getQualityScore(engineResult);
  if (score >= 0.7) return "green";
  if (score >= 0.4) return "amber";
  return "red";
}

/**
 * Returns the quality band from raw KPIs object.
 */
export function getQualityBandFromKpis(
  kpis: Record<string, { value: number; display: string }> | null | undefined
): QualityBand {
  const score = getQualityScoreFromKpis(kpis);
  if (score >= 0.7) return "green";
  if (score >= 0.4) return "amber";
  return "red";
}

/**
 * Returns formatted quality score display string.
 */
export function formatQualityScore(engineResult: EngineResult | null | undefined): string {
  const score = getQualityScore(engineResult);
  return `${Math.round(score * 100)}%`;
}

/**
 * Returns the quality band label for display.
 */
export function getQualityBandLabel(band: QualityBand): string {
  switch (band) {
    case "green":
      return "Institutional Quality";
    case "amber":
      return "Fragile";
    case "red":
      return "Broken";
  }
}

/**
 * Returns detailed breakdown of quality components.
 * Useful for debugging and detailed views.
 */
export function getQualityBreakdown(engineResult: EngineResult | null | undefined): {
  ltvCacComponent: number;
  paybackComponent: number;
  earningsPowerComponent: number;
  burnQualityComponent: number;
  total: number;
  band: QualityBand;
} {
  const kpis = engineResult?.kpis;
  
  const ltvCac = kpis?.ltvCac?.value ?? 3;
  const cacPayback = kpis?.cacPayback?.value ?? 18;
  const earningsPower = kpis?.earningsPower?.value ?? 50;
  const burnQuality = kpis?.burnQuality?.value ?? 50;

  const ltvCacComponent = 0.35 * normalize(ltvCac, 2, 6);
  const paybackComponent = 0.25 * normalizeInverted(cacPayback, 6, 36);
  const earningsPowerComponent = 0.25 * normalize(earningsPower, 20, 80);
  const burnQualityComponent = 0.15 * normalize(burnQuality, 20, 80);

  const total = ltvCacComponent + paybackComponent + earningsPowerComponent + burnQualityComponent;
  const band = total >= 0.7 ? "green" : total >= 0.4 ? "amber" : "red";

  return {
    ltvCacComponent: Math.round(ltvCacComponent * 100) / 100,
    paybackComponent: Math.round(paybackComponent * 100) / 100,
    earningsPowerComponent: Math.round(earningsPowerComponent * 100) / 100,
    burnQualityComponent: Math.round(burnQualityComponent * 100) / 100,
    total: Math.round(total * 100) / 100,
    band,
  };
}

