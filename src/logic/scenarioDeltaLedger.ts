
// src/logic/scenarioDeltaLedger.ts
// Canonical Scenario Delta Ledger (Single Source of Truth)
// - Derived ONLY from engineResults.base and engineResults[activeScenario]
// - Executive panel + variance table + signals MUST consume this

import { getRiskScore, getQualityScore, getQualityBand } from "@/lib/truth/truthSelectors";

// -------------------------
// Types
// -------------------------

export type DeltaType = "positive" | "negative" | "neutral";

export interface LedgerNumber {
  base: number;
  scenario: number;
  delta: number;      // scenario - base
  deltaPct?: number;  // optional; expressed as ratio (e.g. -0.102 = -10.2%)
}

export interface ScenarioDeltaLedger {
  activeScenario: string;

  // Canonical Risk
  // riskIndex is health (higher=safer), but UI uses RiskScore = 100 - riskIndex
  riskScore: LedgerNumber;

  // ARR Scale (Next 12 months)
  arr12: LedgerNumber;

  // Growth (ARR Growth % in percent units, not ratio)
  // NOTE: kpis.arrGrowthPct.value is ratio; we convert to percent here.
  arrGrowthPct: LedgerNumber;

  // Runway (months)
  runwayMonths: LedgerNumber;

  // Quality
  qualityScore: LedgerNumber;     // numeric score (0-100 if your function does that)
  qualityBand: {
    base: string;
    scenario: string;
  };
}

// -------------------------
// Helpers
// -------------------------

function asNumber(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function deltaTypeFromDelta(delta: number, eps = 1e-9): DeltaType {
  if (Math.abs(delta) <= eps) return "neutral";
  return delta > 0 ? "positive" : "negative";
}

function buildLedgerNumber(base: number, scenario: number, pctMode?: "ratio" | "none"): LedgerNumber {
  const b = asNumber(base);
  const s = asNumber(scenario);
  const d = s - b;

  // pctMode "ratio" means compute percent change ratio: d / |b| (safe), else omit.
  if (pctMode === "ratio") {
    const denom = Math.abs(b) > 1e-9 ? Math.abs(b) : 0;
    const pct = denom > 0 ? d / denom : undefined;
    return { base: b, scenario: s, delta: d, deltaPct: pct };
  }

  return { base: b, scenario: s, delta: d };
}

// -------------------------
// Canonical Builder
// -------------------------

export function buildScenarioDeltaLedger(args: {
  engineResults: any;        // keep loose until you want to lock to exact engine types
  activeScenario: string;
}): ScenarioDeltaLedger | null {
  const { engineResults, activeScenario } = args;

  const baseRes = engineResults?.base;
  const scRes = engineResults?.[activeScenario];

  if (!baseRes?.kpis || !scRes?.kpis) return null;

  const baseK = baseRes.kpis;
  const scK = scRes.kpis;

  // ---- Canonical RiskScore ----
  // Must use getRiskScore(engineResult) everywhere.
  const riskBase = asNumber(getRiskScore(baseRes));
  const riskSc = asNumber(getRiskScore(scRes));
  const riskScore = buildLedgerNumber(riskBase, riskSc);

  // ---- ARR 12m ----
  // Source: arrNext12 (as per spider axis lock)
  const arr12Base = asNumber(baseK?.arrNext12?.value ?? baseK?.arrNext12);
  const arr12Sc = asNumber(scK?.arrNext12?.value ?? scK?.arrNext12);
  const arr12 = buildLedgerNumber(arr12Base, arr12Sc, "ratio"); // useful to have pct change

  // ---- Growth % (percent units) ----
  // Source is ratio (e.g. -0.102) -> must multiply by 100
  const gBaseRatio = asNumber(baseK?.arrGrowthPct?.value ?? baseK?.arrGrowthPct);
  const gScRatio = asNumber(scK?.arrGrowthPct?.value ?? scK?.arrGrowthPct);
  const gBasePct = gBaseRatio * 100;
  const gScPct = gScRatio * 100;
  const arrGrowthPct = buildLedgerNumber(gBasePct, gScPct);

  // ---- Runway ----
  // If you already have a canonical runway KPI key, use it here.
  // Common patterns: runwayMonths, runway, runwayMths. We'll support a few.
  const runwayBase =
    asNumber(baseK?.runwayMonths?.value ?? baseK?.runwayMonths) ||
    asNumber(baseK?.runway?.value ?? baseK?.runway) ||
    asNumber(baseK?.runwayMths?.value ?? baseK?.runwayMths);

  const runwaySc =
    asNumber(scK?.runwayMonths?.value ?? scK?.runwayMonths) ||
    asNumber(scK?.runway?.value ?? scK?.runway) ||
    asNumber(scK?.runwayMths?.value ?? scK?.runwayMths);

  const runwayMonths = buildLedgerNumber(runwayBase, runwaySc);

  // ---- Quality ----
  // Locked: computed, not guessed.
  // quality score may be derived from the whole engineResult or from KPIs depending on your implementation.
  // We'll treat these as canonical functions.
  const qBase = asNumber(getQualityScore(baseRes));
  const qSc = asNumber(getQualityScore(scRes));
  const qualityScore = buildLedgerNumber(qBase, qSc);

  const qualityBand = {
    base: String(getQualityBand(baseRes)),
    scenario: String(getQualityBand(scRes)),
  };

  return {
    activeScenario,
    riskScore,
    arr12,
    arrGrowthPct,
    runwayMonths,
    qualityScore,
    qualityBand,
  };
}

// Optional: for UI tone mapping (kept here so everyone uses same tone rules)
export function ledgerDeltaType(n: LedgerNumber): DeltaType {
  return deltaTypeFromDelta(n.delta);
}
