export const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Smooth, deterministic "noise" for subtle camera/scene shake.
// Avoids per-frame Math.random() jitter (which reads as instability).
export function smoothSeismicNoise(t: number, seed: number) {
  // Sum of sines at incommensurate-ish frequencies → organic but continuous.
  const a = Math.sin(t * 7.13 + seed * 1.7);
  const b = Math.sin(t * 12.77 + seed * 3.1);
  const c = Math.sin(t * 19.31 + seed * 5.3);
  // Normalize-ish to [-1, 1]
  return a * 0.62 + b * 0.28 + c * 0.1;
}
