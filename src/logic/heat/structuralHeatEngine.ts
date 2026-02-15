// src/logic/heat/structuralHeatEngine.ts
// STRATFIT — Structural Heat Engine
// Purpose: encode baseline financial composition quality (NOT stress heat).
// Deterministic, typed, reusable across Baseline + Risk.

import type { BaselineV1 } from "@/onboard/baseline";

export type HeatLevel = "strong" | "stable" | "watch" | "weak" | "critical";

export interface HeatResult {
  level: HeatLevel;
  /** Normalized 0–100 (higher = stronger composition) */
  score: number;
  /** CSS variable token name only (e.g. "--heat-strong") */
  color: `--heat-${HeatLevel}`;
  /** 0..1 for glow alpha (used by consumers with CSS Color 4: rgb(from var(...) ... / a)) */
  glowOpacity: number;
}

export type StructuralMetricKey =
  | "margin"
  | "runway"
  | "burnRatio"
  | "revenueConcentration"
  | "survivalBaseline";

/**
 * BaselineModel context for structural heat evaluation.
 * - Uses canonical BaselineV1 truth layer
 * - Adds derived fields needed for structural quality encoding
 */
export interface BaselineModel {
  baseline: BaselineV1;
  derived: {
    runwayMonths: number;
    /** Burn ratio (monthly burn / monthly ARR). Higher is worse. */
    burnRatio: number;
    /** Survival baseline (%) — higher is better. */
    survivalBaselinePct: number;
  };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function clamp01(n: number) {
  return clamp(n, 0, 1);
}

function roundScore01To100(s01: number): number {
  return Math.round(clamp01(s01) * 100);
}

function token(level: HeatLevel): HeatResult["color"] {
  return `--heat-${level}` as const;
}

function toHeatResult(level: HeatLevel, score01: number, glowOpacity: number): HeatResult {
  return {
    level,
    score: roundScore01To100(score01),
    color: token(level),
    glowOpacity: clamp(glowOpacity, 0, 1),
  };
}

/**
 * Deterministic: map a 0..100 score to a HeatLevel.
 * Order is institutional (strong/stable/watch/weak/critical).
 */
function levelFromScore(score: number): HeatLevel {
  if (score >= 86) return "strong";
  if (score >= 70) return "stable";
  if (score >= 55) return "watch";
  if (score >= 40) return "weak";
  return "critical";
}

/**
 * Normalize a value to 0..1 given "good" range.
 * If invert=true, higher values reduce score.
 */
function normalizeLinear(value: number, min: number, max: number, invert = false): number {
  if (!Number.isFinite(value)) return 0;
  if (max === min) return 0;
  const t = clamp01((value - min) / (max - min));
  return invert ? 1 - t : t;
}

/**
 * Evaluate a structural metric to a HeatResult.
 *
 * Rules from spec (hard requirements):
 * - Margin > 60% = strong
 * - Runway > 18 months = strong
 * - Burn ratio > 1.5 = weak
 * - Revenue concentration > 70% = weak
 * - Survival baseline < 75% = critical
 *
 * IMPORTANT: Consumers pass the metric-specific value, but context is available
 * to support consistent policy and future extensions (industry/phase adjustments).
 */
export function evaluateStructuralMetric(
  metricKey: string,
  value: number,
  context: BaselineModel,
): HeatResult {
  // Ensure determinism on NaN/Infinity
  const v = Number.isFinite(value) ? value : 0;

  switch (metricKey as StructuralMetricKey) {
    case "margin": {
      // Value: gross margin percent (0..100)
      // Strong: >= 60
      // Stable: 45..60
      // Watch: 30..45
      // Weak: 15..30
      // Critical: < 15
      const score01 = normalizeLinear(v, 10, 70, false);
      const score = roundScore01To100(score01);
      const level: HeatLevel =
        v >= 60 ? "strong" :
        v >= 45 ? "stable" :
        v >= 30 ? "watch" :
        v >= 15 ? "weak" :
        "critical";
      // Slightly stronger glow for extremes, capped.
      const glow = level === "strong" ? 0.22 : level === "critical" ? 0.26 : 0.18;
      return { level, score, color: token(level), glowOpacity: glow };
    }

    case "runway": {
      // Value: runway months
      // Strong: >= 18
      // Stable: 12..18
      // Watch: 9..12
      // Weak: 6..9
      // Critical: < 6
      const score01 = normalizeLinear(v, 3, 24, false);
      const score = roundScore01To100(score01);
      const level: HeatLevel =
        v >= 18 ? "strong" :
        v >= 12 ? "stable" :
        v >= 9 ? "watch" :
        v >= 6 ? "weak" :
        "critical";
      const glow = level === "strong" ? 0.20 : level === "critical" ? 0.28 : 0.18;
      return { level, score, color: token(level), glowOpacity: glow };
    }

    case "burnRatio": {
      // Value: burn ratio (monthly burn / monthly ARR). Higher is worse.
      // Spec: > 1.5 = weak (minimum requirement).
      // Institutional mapping:
      // - strong: <= 0.8
      // - stable: <= 1.1
      // - watch:  <= 1.5
      // - weak:   <= 2.0
      // - critical: > 2.0
      const score01 = normalizeLinear(v, 0.6, 2.2, true);
      const score = roundScore01To100(score01);
      const level: HeatLevel =
        v <= 0.8 ? "strong" :
        v <= 1.1 ? "stable" :
        v <= 1.5 ? "watch" :
        v <= 2.0 ? "weak" :
        "critical";
      const glow = level === "strong" ? 0.18 : level === "critical" ? 0.30 : 0.20;
      return { level, score, color: token(level), glowOpacity: glow };
    }

    case "revenueConcentration": {
      // Value: revenue concentration percent (0..100).
      // Spec: > 70 = weak (minimum requirement).
      // - strong: <= 30
      // - stable: <= 50
      // - watch:  <= 70
      // - weak:   <= 85
      // - critical: > 85
      const score01 = normalizeLinear(v, 25, 90, true);
      const score = roundScore01To100(score01);
      const level: HeatLevel =
        v <= 30 ? "strong" :
        v <= 50 ? "stable" :
        v <= 70 ? "watch" :
        v <= 85 ? "weak" :
        "critical";
      const glow = level === "strong" ? 0.16 : level === "critical" ? 0.30 : 0.19;
      return { level, score, color: token(level), glowOpacity: glow };
    }

    case "survivalBaseline": {
      // Value: survival baseline percent (0..100).
      // Spec: < 75 = critical (hard requirement).
      // - strong: >= 90
      // - stable: >= 80
      // - watch:  >= 75
      // - critical: < 75
      const score01 = normalizeLinear(v, 60, 95, false);
      const score = roundScore01To100(score01);
      const level: HeatLevel =
        v < 75 ? "critical" :
        v >= 90 ? "strong" :
        v >= 80 ? "stable" :
        "watch";
      const glow = level === "strong" ? 0.22 : level === "critical" ? 0.34 : 0.20;
      return { level, score, color: token(level), glowOpacity: glow };
    }

    default: {
      // Unknown key => stable/neutral, deterministic.
      // Use context to avoid unused parameter lint and preserve future flexibility.
      void context;
      const score = roundScore01To100(0.7);
      return { level: "stable", score, color: token("stable"), glowOpacity: 0.16 };
    }
  }
}

/**
 * Convert an aggregate structural score (0..100) into a HeatResult.
 * This is used for mountain tinting + neutral metric tinting when a specific
 * metric heat is not applicable.
 */
export function evaluateStructuralScore(score0to100: number): HeatResult {
  const score = clamp(Math.round(score0to100), 0, 100);
  const level = levelFromScore(score);
  // Subtle: only a faint underglow, even at extremes.
  const glowOpacity =
    level === "strong" ? 0.18 :
    level === "stable" ? 0.16 :
    level === "watch" ? 0.17 :
    level === "weak" ? 0.20 :
    0.24;
  return {
    level,
    score,
    color: token(level),
    glowOpacity,
  };
}

/**
 * Build a BaselineModel from BaselineV1 + survival baseline.
 * Centralizes all structural-heat context derivations (no UI thresholds here).
 */
export function buildBaselineModel(baseline: BaselineV1, survivalBaselinePct: number): BaselineModel {
  const monthlyBurn = baseline.financial.monthlyBurn || 0;
  const cash = baseline.financial.cashOnHand || 0;
  const arr = baseline.financial.arr || 0;

  const runwayMonths = monthlyBurn > 0 ? cash / monthlyBurn : 999;
  const monthlyArr = arr / 12;
  // Burn ratio = monthly burn / monthly ARR (higher is worse)
  const burnRatio = monthlyArr > 0 ? monthlyBurn / monthlyArr : 10;

  return {
    baseline,
    derived: {
      runwayMonths: clamp(runwayMonths, 0, 120),
      burnRatio: clamp(burnRatio, 0, 10),
      survivalBaselinePct: clamp(survivalBaselinePct, 0, 100),
    },
  };
}

/**
 * Helper: compute an aggregate structural score (0..100) for mountain tinting.
 * Weighted toward capital durability and concentration risk.
 */
export function aggregateStructuralHeatScore(ctx: BaselineModel): number {
  const b = ctx.baseline;
  const d = ctx.derived;

  const margin = evaluateStructuralMetric("margin", b.financial.grossMarginPct, ctx).score;
  const runway = evaluateStructuralMetric("runway", d.runwayMonths, ctx).score;
  const burn = evaluateStructuralMetric("burnRatio", d.burnRatio, ctx).score;
  const conc = evaluateStructuralMetric("revenueConcentration", b.financial.revenueConcentrationPct, ctx).score;
  const surv = evaluateStructuralMetric("survivalBaseline", d.survivalBaselinePct, ctx).score;

  // Institutional weight set (sums to 1.0)
  const score =
    margin * 0.20 +
    runway * 0.25 +
    burn * 0.15 +
    conc * 0.20 +
    surv * 0.20;

  return clamp(Math.round(score), 0, 100);
}


