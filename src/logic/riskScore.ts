// src/logic/riskScore.ts
// STRATFIT — Single Source of Truth for Risk
//
// CANONICAL DECISION:
//   riskIndex  = health metric (higher = healthier)
//   riskScore  = danger metric (higher = more dangerous)
//
// The UI must NEVER display riskIndex directly as "Risk".
// All components must use getRiskScore().

import type { EngineResult } from "@/state/scenarioStore";

/**
 * Returns the risk score (0-100) where HIGHER = MORE DANGEROUS.
 * This is the ONLY function that should be used to display risk in the UI.
 *
 * Formula: riskScore = 100 - riskIndex
 *
 * @param engineResult - The engine result containing kpis.riskIndex
 * @returns Risk score (0-100), higher = more dangerous
 */
export function getRiskScore(engineResult: EngineResult | null | undefined): number {
  const riskIndex = engineResult?.kpis?.riskIndex?.value ?? 50;
  return Math.round(100 - riskIndex);
}

/**
 * Returns the risk score from raw KPIs object.
 * Use when you have kpis directly instead of full engineResult.
 */
export function getRiskScoreFromKpis(
  kpis: Record<string, { value: number; display: string }> | null | undefined
): number {
  const riskIndex = kpis?.riskIndex?.value ?? 50;
  return Math.round(100 - riskIndex);
}

/**
 * Returns formatted risk score display string.
 */
export function formatRiskScore(engineResult: EngineResult | null | undefined): string {
  const score = getRiskScore(engineResult);
  return `${score}/100`;
}

/**
 * Returns risk band for color coding.
 * - "low": 0-33 (green)
 * - "medium": 34-66 (amber)
 * - "high": 67-100 (red)
 */
export function getRiskBand(engineResult: EngineResult | null | undefined): "low" | "medium" | "high" {
  const score = getRiskScore(engineResult);
  if (score <= 33) return "low";
  if (score <= 66) return "medium";
  return "high";
}

