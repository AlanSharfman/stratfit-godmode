/**
 * Math utilities for MountainEngine
 */

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

export function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, x));
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function inverseLerp(a: number, b: number, v: number): number {
  return (v - a) / (b - a);
}

export function remap(
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  v: number
): number {
  const t = inverseLerp(inMin, inMax, v);
  return lerp(outMin, outMax, t);
}