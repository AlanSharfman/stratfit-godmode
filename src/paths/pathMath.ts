// src/paths/pathMath.ts
// Deterministic helpers for STRATFIT path shaping (no randomness without seed)

export function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export function smoothstep(t: number) {
  t = clamp01(t);
  return t * t * (3 - 2 * t);
}

// Tiny hash -> [0,1)
export function hash01(seed: number) {
  // xorshift-ish
  let x = seed | 0;
  x ^= x << 13;
  x ^= x >> 17;
  x ^= x << 5;
  // convert to [0,1)
  return ((x >>> 0) % 100000) / 100000;
}

// 1D smooth noise along t in [0,1]
export function noise1D(seed: number, t: number) {
  const x = t * 16; // frequency (tunable)
  const i0 = Math.floor(x);
  const i1 = i0 + 1;
  const f = x - i0;

  const a = hash01(seed + i0 * 1013);
  const b = hash01(seed + i1 * 1013);

  return a + (b - a) * smoothstep(f); // [0,1]
}
