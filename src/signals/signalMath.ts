import { clamp01 } from "./strategicSignalTypes";

export function safeDiv(n: number, d: number): number {
  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return 0;
  return n / d;
}

/**
 * Normalizes an absolute delta against a scale value.
 * Example: absDelta=3, scale=12 -> 0.25
 */
export function normalizeAbsDelta(absDelta: number, scale: number): number {
  return clamp01(Math.abs(safeDiv(absDelta, scale)));
}

/**
 * Maps a signed delta into direction buckets.
 */
export function directionFromDelta(delta: number): "improving" | "deteriorating" | "flat" {
  if (delta > 0) return "improving";
  if (delta < 0) return "deteriorating";
  return "flat";
}

/**
 * Normalizes a value within [min,max] into 0..1, clamped.
 */
export function normalizeRange(value: number, min: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || max === min) return 0;
  return clamp01((value - min) / (max - min));
}
