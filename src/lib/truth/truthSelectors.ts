// src/lib/truth/truthSelectors.ts
// STRATFIT Truth Selectors — single canonical source for deltas, risk, quality.
// No UI layer may compute these independently.

import type { EngineResult, ScenarioId } from "@/state/scenarioStore";

// Re-export the canonical types so all callers can import from here if desired.
export type { EngineResult, ScenarioId };

// NOTE:
// We deliberately DO NOT define a second EngineResult contract here.
// EngineResult is canonical in scenarioStore:
//   { kpis: Record<string, { value:number; display?:string }>, ai?, timeline? }
// Any future cashflow/valuation/risk structures must be derived or explicitly added
// to the canonical EngineResult later (not invented here).

export type EngineResults = Record<string, EngineResult>;

// -----------------------------
// helpers
// -----------------------------
function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function norm(x: number, min: number, max: number): number {
  if (max === min) return 0;
  return clamp01((x - min) / (max - min));
}

function invNorm(x: number, min: number, max: number): number {
  return 1 - norm(x, min, max);
}

function getKpi(er: EngineResult, key: string): number {
  const v = er?.kpis?.[key]?.value;
  return typeof v === "number" ? v : NaN;
}

// -----------------------------
// Risk (SEMANTICS LOCK)
// riskIndex behaves like HEALTH: higher = better.
// RiskScore must be higher = worse.
// -----------------------------
export function getRiskHealth(er: EngineResult): number {
  return getKpi(er, "riskIndex");
}

export function getRiskScore(er: EngineResult): number {
  const health = getRiskHealth(er);
  if (!Number.isFinite(health)) return NaN;
  return 100 - health;
}

// -----------------------------
// Quality (FORMULA LOCK)
// Quality = unit economics + efficiency (NOT growth/scale/runway).
// Inputs are taken from KPI keys.
// -----------------------------
export function getQualityScore(er: EngineResult): number {
  const ltvCac = getKpi(er, "ltvCac");
  const payback = getKpi(er, "cacPayback");
  const earningsPower = getKpi(er, "earningsPower"); // proxy for margin/efficiency
  const burnQuality = getKpi(er, "burnQuality"); // proxy for burn discipline

  // normalize to 0..1
  const ltvScore = Number.isFinite(ltvCac) ? norm(ltvCac, 2, 6) : 0;
  const paybackScore = Number.isFinite(payback) ? invNorm(payback, 36, 6) : 0; // lower is better
  const earnScore = Number.isFinite(earningsPower) ? norm(earningsPower, 20, 80) : 0;
  const burnScore = Number.isFinite(burnQuality) ? norm(burnQuality, 20, 80) : 0;

  // weights locked
  const score = 0.35 * ltvScore + 0.25 * paybackScore + 0.25 * earnScore + 0.15 * burnScore;

  return clamp01(score);
}

export type QualityBand = "green" | "yellow" | "red";

export function getQualityBand(score: number): QualityBand {
  if (!Number.isFinite(score)) return "red";
  if (score >= 0.7) return "green";
  if (score >= 0.4) return "yellow";
  return "red";
}

// -----------------------------
// Delta helpers (for table + exec panel)
// -----------------------------
export function delta(base: number, scenario: number): number {
  return scenario - base;
}

export function deltaPct(base: number, scenario: number): number | null {
  if (!Number.isFinite(base) || base === 0) return null;
  if (!Number.isFinite(scenario)) return null;
  return (scenario - base) / base;
}
