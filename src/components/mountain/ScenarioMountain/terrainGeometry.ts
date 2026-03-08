/**
 * Terrain geometry utilities extracted from ScenarioMountainImpl.
 * Constants, noise functions, and height computation for the mountain surface.
 */

import { clamp01, lerp } from "./helpers";

// ============================================================================
// CONSTANTS
// ============================================================================

export const GRID_W = 120;
export const GRID_D = 60;
export const MESH_W = 50;
export const MESH_D = 25;
export const ISLAND_RADIUS = 22;

export const BASE_SCALE = 7.0;
export const PEAK_SCALE = 5.5;
export const MASSIF_SCALE = 7.5;
export const RIDGE_SHARPNESS = 1.4;
export const CLIFF_BOOST = 1.2;

export const SOFT_CEILING = 14.0;
export const CEILING_START = 11.0;

// ============================================================================
// NOISE / GAUSSIAN HELPERS
// ============================================================================

export function noise2(x: number, z: number): number {
  const n1 = Math.sin(x * 0.7 + z * 0.35) * 0.2;
  const n2 = Math.cos(x * 1.2 - z * 0.6) * 0.15;
  const n3 = Math.sin(x * 2.1 + z * 1.8) * 0.08;
  return n1 + n2 + n3;
}

// ridgeNoise — all Math.abs so no phase-dependent L/R bias.
// Returns a positive roughness value at any point, used to add
// geological texture proportional to the base height.
export function ridgeNoise(x: number, z: number): number {
  // Primary ridge fold — large-scale backbone ridges
  const fold    = Math.abs(Math.sin(x * 0.52 + z * 0.18));
  // Secondary eroded gullies running ↗
  const gulliesA = Math.abs(Math.sin(x * 2.5  + z * 1.5));
  // Cross-cut gullies running ↘ — balances erosion both sides
  const gulliesB = Math.abs(Math.sin(x * 2.3  - z * 1.8));
  // Mid-scale shoulder breaks
  const shoulder = Math.abs(Math.sin(x * 1.1  + z * 0.9));
  // Fine-grain scree / talus
  const scree    = Math.abs(Math.sin(x * 4.7  + z * 0.6));
  return fold * 0.12 + gulliesA * 0.09 + gulliesB * 0.07 + shoulder * 0.06 + scree * 0.03;
}

// ── Layer 2: RIDGE STRUCTURE ────────────────────────────────────────────────
// Uses 1-|sin(x)| fold: returns 1 at ridge crest, 0 at valley floor.
// This is the key difference from ridgeNoise — it CARVES valleys rather
// than only adding roughness. Multiple octaves at different angles avoid
// artificial stripe patterns (each pass runs at a different diagonal).
// Used in computeStaticTerrainHeight as a sculpt on the macro shape:
//   h = macro * (0.80 + ridgeMod * 0.40)
// → valley (ridgeMod≈0): 80% of macro (20% cut)
// → crest  (ridgeMod≈1): 120% of macro (20% lift)
// → crest:valley ratio ≈ 1.5× — readable separation without drama
export function ridgeLayer(x: number, z: number): number {
  // Large primary ridges — ~3 crest lines across the 50-unit terrain width.
  // Crests follow diagonal lines so they read as geological ridges, not stripes.
  // r1 crests run at ~-19° from horizontal, r2 at ~+34° — cross-hatch effect.
  const r1 = 1 - Math.abs(Math.sin(x * 0.38 + z * 0.13));
  const r2 = 1 - Math.abs(Math.sin(x * 0.36 - z * 0.24));
  // Medium sub-ridges — branching spurs off the primary crests.
  // r3 at ~-32°, r4 at ~+38° — adds a second layer of ridge detail.
  const r3 = 1 - Math.abs(Math.sin(x * 0.75 + z * 0.47));
  const r4 = 1 - Math.abs(Math.sin(x * 0.72 - z * 0.56));

  // Power sharpening: compresses intermediate slope values toward valleys.
  // Without power: gradients are gentle. With power 1.5–2.0: mid-slopes
  // drop quickly, leaving distinct crest lines above clear basin floors.
  const large  = Math.pow((r1 + r2) * 0.5, 1.5);  // 0→~1
  const medium = Math.pow((r3 + r4) * 0.5, 2.0);  // 0→~1, tighter crests

  return large * 0.65 + medium * 0.35;  // 0 (valley floor) → ~1 (ridge crest)
}

export function gaussian1(x: number, c: number, s: number): number {
  const t = (x - c) / Math.max(0.1, s);
  return Math.exp(-0.5 * t * t);
}

export function gaussian2(dx: number, dz: number, sx: number, sz: number): number {
  return Math.exp(-0.5 * ((dx * dx) / (sx * sx) + (dz * dz) / (sz * sz)));
}

export function applySoftCeiling(h: number): number {
  if (h <= CEILING_START) return h;
  const excess = h - CEILING_START;
  const range = SOFT_CEILING - CEILING_START;
  return CEILING_START + range * (1 - Math.exp(-excess / range));
}

// ============================================================================
// MASSIF PEAKS
// ============================================================================

export interface MassifPeak {
  x: number;
  z: number;
  amplitude: number;
  sigmaX: number;
  sigmaZ: number;
}

// Tighter sigmas → distinct peaks with clear saddles between them.
// Previously sigmas were 3.6–5.0, causing peaks to blur into one dome.
// Now primary summit is narrow (2.0×1.8), secondaries are modest (2.6–2.8),
// and the far wing peaks are intentionally smaller so the full range reads
// as one dominant summit + supporting ridgeline network.
export const MASSIF_PEAKS: MassifPeak[] = [
  // ── Primary summit (Liquidity Basin cliff face)
  { x:  0,   z: -1.5, amplitude: 1.5,  sigmaX: 1.3,  sigmaZ: 1.1 },
  // ── Left wing secondary ridge (camera-right)
  { x: -10,  z: -0.5, amplitude: 1.05, sigmaX: 1.6,  sigmaZ: 1.4 },
  // ── Right wing secondary ridge (camera-left)
  { x:  11,  z: -1.0, amplitude: 1.0,  sigmaX: 2.4,  sigmaZ: 2.0 },
  // ── Near-centre camera-right spur
  { x: -3,   z:  2.5, amplitude: 0.75, sigmaX: 2.8,  sigmaZ: 2.4 },
  // ── Near-centre camera-left spur (mirror)
  { x:  5,   z: -1.5, amplitude: 0.75, sigmaX: 2.6,  sigmaZ: 2.2 },
  // ── Far-left shoulder / Revenue Flow shelf
  { x: -17,  z:  1.5, amplitude: 0.55, sigmaX: 3.6,  sigmaZ: 2.8 },
  // ── Far-right shoulder / Runway Horizon shelf
  { x:  18,  z:  0.5, amplitude: 0.50, sigmaX: 3.2,  sigmaZ: 2.6 },
  // ── Rear mid saddle — creates a natural col behind primary summit
  { x:  0,   z:  5.0, amplitude: 0.45, sigmaX: 5.0,  sigmaZ: 2.0 },
];

// ============================================================================
// RIDGE NETWORK — Explicit structural ridges connecting peaks
// ============================================================================
// A set of narrow elongated gaussians oriented as ridge spines.
// These create the visual "backbone" lines you see on real mountain ranges.
interface RidgeSpine {
  x: number; z: number;
  amplitude: number;
  sigmaX: number; sigmaZ: number;
  // orientation angle (radians) — used to rotate the ridge gaussian
  angle: number;
}

const RIDGE_SPINES: RidgeSpine[] = [
  // Summit → left wing connector
  { x: -5,   z: -1.0, amplitude: 0.55, sigmaX: 7.0, sigmaZ: 0.8, angle:  0.15 },
  // Summit → right wing connector
  { x:  6,   z: -1.2, amplitude: 0.5,  sigmaX: 7.0, sigmaZ: 0.8, angle: -0.18 },
  // Left wing → far shoulder
  { x: -13,  z:  0.5, amplitude: 0.35, sigmaX: 5.0, sigmaZ: 0.7, angle:  0.25 },
  // Right wing → far shoulder
  { x:  15,  z: -0.3, amplitude: 0.32, sigmaX: 4.5, sigmaZ: 0.7, angle: -0.20 },
];

// ============================================================================
// EROSION — Left face (positive X, user's left side)
// ============================================================================
// Oriented elongated gaussians simulate water-carved gullies running
// diagonally DOWN the positive-X slope face — matching the drainage
// direction you'd see on a real mountain (upper-left → lower-right).
// A side mask (smooth ramp x=2→7) keeps cuts strictly on the left face.
// Micro-relief bumps are added to match the organic surface variation the
// right side gets naturally from the ridge spine network.

interface ErosionChannel {
  cx: number; cz: number;   // centre
  depth: number;             // positive = cut depth
  sigmaAlong: number;        // length along the drainage direction
  sigmaAcross: number;       // width across the channel
  angle: number;             // radians — drainage run direction
}

const EROSION_CHANNELS: ErosionChannel[] = [
  // Upper-face primary channels — tight, deep, run steeply down
  { cx:  6.5, cz: -0.8, depth: 1.8, sigmaAlong: 4.5, sigmaAcross: 0.4, angle: -0.55 },
  { cx:  9.0, cz: -0.3, depth: 1.6, sigmaAlong: 4.2, sigmaAcross: 0.4, angle: -0.50 },
  { cx: 11.5, cz: -0.6, depth: 1.5, sigmaAlong: 3.8, sigmaAcross: 0.4, angle: -0.48 },
  { cx: 13.5, cz:  0.1, depth: 1.3, sigmaAlong: 3.5, sigmaAcross: 0.35,angle: -0.45 },
  // Mid-face secondary channels — shallower, slightly wider
  { cx:  7.5, cz:  2.2, depth: 1.1, sigmaAlong: 3.8, sigmaAcross: 0.5, angle: -0.42 },
  { cx: 10.0, cz:  2.0, depth: 1.0, sigmaAlong: 3.5, sigmaAcross: 0.5, angle: -0.40 },
  { cx: 12.5, cz:  2.5, depth: 0.9, sigmaAlong: 3.2, sigmaAcross: 0.45,angle: -0.38 },
  // Far-shoulder drainage
  { cx: 15.5, cz:  1.0, depth: 0.9, sigmaAlong: 4.0, sigmaAcross: 0.55,angle: -0.35 },
  { cx: 17.5, cz:  2.0, depth: 0.7, sigmaAlong: 3.5, sigmaAcross: 0.55,angle: -0.30 },
];

// Micro-relief bumps on the left face — dense small ridgelets between gullies
// that tilt individual mesh facets in varied directions, giving the same
// organic light-catching surface the right side has naturally from peak overlap.
// 16 bumps across upper-face, mid-face, shoulder zones.
interface ReliefBump {
  cx: number; cz: number;
  height: number;
  sx: number; sz: number;
}
const LEFT_RELIEF_BUMPS: ReliefBump[] = [
  // Upper-face ridgelets — between the gully cuts, x=6–14
  { cx:  7.0, cz: -1.5, height: 0.80, sx: 0.85, sz: 0.65 },
  { cx:  8.8, cz: -0.8, height: 0.70, sx: 0.80, sz: 0.60 },
  { cx: 10.2, cz: -1.2, height: 0.75, sx: 0.90, sz: 0.65 },
  { cx: 12.0, cz: -0.5, height: 0.65, sx: 0.80, sz: 0.60 },
  { cx: 14.0, cz: -0.8, height: 0.60, sx: 0.85, sz: 0.65 },
  // Mid-face ridgelets
  { cx:  7.5, cz:  1.5, height: 0.75, sx: 1.00, sz: 0.75 },
  { cx:  9.5, cz:  1.0, height: 0.70, sx: 0.90, sz: 0.70 },
  { cx: 11.0, cz:  1.5, height: 0.65, sx: 1.00, sz: 0.75 },
  { cx: 13.0, cz:  1.2, height: 0.60, sx: 0.90, sz: 0.70 },
  { cx: 14.8, cz:  2.0, height: 0.55, sx: 1.10, sz: 0.80 },
  // Shoulder/lower-face humps — x=15–19, matches right-side shoulder texture
  { cx: 15.5, cz:  0.5, height: 0.65, sx: 1.30, sz: 1.00 },
  { cx: 17.0, cz:  1.5, height: 0.60, sx: 1.20, sz: 0.90 },
  { cx: 16.0, cz:  3.5, height: 0.55, sx: 1.40, sz: 1.00 },
  { cx: 18.5, cz:  2.5, height: 0.50, sx: 1.20, sz: 0.90 },
  // Near-centre transition zone
  { cx:  5.5, cz:  2.5, height: 0.70, sx: 1.10, sz: 0.90 },
  { cx:  6.5, cz:  4.0, height: 0.60, sx: 1.30, sz: 1.00 },
];

export function erosionHeight(x: number, z: number): number {
  // Smooth ramp: no effect left of x=2, full effect by x=7
  const sideMask = Math.max(0, Math.min(1, (x - 2) / 5));
  if (sideMask <= 0) return 0;

  // Oriented gully cuts
  let cut = 0;
  for (const c of EROSION_CHANNELS) {
    const dx = x - c.cx;
    const dz = z - c.cz;
    const along  =  dx * Math.cos(c.angle) + dz * Math.sin(c.angle);
    const across = -dx * Math.sin(c.angle) + dz * Math.cos(c.angle);
    const g = Math.exp(-0.5 * (
      (along * along) / (c.sigmaAlong * c.sigmaAlong) +
      (across * across) / (c.sigmaAcross * c.sigmaAcross)
    ));
    cut += g * c.depth;
  }

  // Micro-relief bumps between gullies
  let bump = 0;
  for (const b of LEFT_RELIEF_BUMPS) {
    bump += gaussian2(x - b.cx, z - b.cz, b.sx, b.sz) * b.height;
  }

  // Scree fan — deposition lobe at base of eroded face
  const scree = gaussian2(x - 16.5, z + 3.8, 3.5, 1.6) * 0.4;

  return (-cut + bump + scree) * sideMask;
}

export function ridgeSpineHeight(x: number, z: number): number {
  let h = 0;
  for (const r of RIDGE_SPINES) {
    const dx = x - r.x;
    const dz = z - r.z;
    // Rotate into spine local space
    const rx = dx * Math.cos(r.angle) + dz * Math.sin(r.angle);
    const rz = -dx * Math.sin(r.angle) + dz * Math.cos(r.angle);
    const g = Math.exp(-0.5 * ((rx * rx) / (r.sigmaX * r.sigmaX) + (rz * rz) / (r.sigmaZ * r.sigmaZ)));
    h += g * r.amplitude;
  }
  return h;
}

// ============================================================================
// HEIGHT COMPUTATION
// ============================================================================

/**
 * Compute terrain height at a specific (x, z) position using the SAME algorithm
 * as the Terrain component's useLayoutEffect. This MUST stay in sync.
 * Does not include peakModel dynamic peaks (activeKpi / activeLever) — only
 * the signature backbone + data-driven shape + massif + noise.
 */
export function computeStaticTerrainHeight(x: number, z: number, dp: number[]): number {
  const wHalf = MESH_W / 2;
  const kpiX = ((x + wHalf) / MESH_W) * 6;

  // ── Layer 1: MACRO — broad mountain form
  // KPI-driven ridge
  let ridge = 0;
  for (let idx = 0; idx < 7; idx++) {
    const v = clamp01(dp[idx]);
    const g = gaussian1(kpiX, idx, 0.48);
    ridge += Math.pow(v, RIDGE_SHARPNESS) * g;
  }
  let macro = ridge * BASE_SCALE;

  // Massif peaks — distinct summits with clear saddles
  for (const m of MASSIF_PEAKS) {
    const g = gaussian2(x - m.x, z - m.z, m.sigmaX, m.sigmaZ);
    macro += g * m.amplitude * MASSIF_SCALE;
  }

  // Structural ridge spines — elongated connectors between peaks
  macro += ridgeSpineHeight(x, z) * MASSIF_SCALE;

  // Signature peak backbone — always present, even with no active KPI
  const signaturePeaks = [
    { index: 3.1, amplitude: 0.55, sigma: 1.6 },  // dominant summit spike
    { index: 2.0, amplitude: 0.38, sigma: 1.2 },  // left secondary
    { index: 4.3, amplitude: 0.38, sigma: 1.2 },  // right secondary
    { index: 1.0, amplitude: 0.25, sigma: 1.0 },  // far left spur
    { index: 5.2, amplitude: 0.25, sigma: 1.0 },  // far right spur
  ];
  for (const p of signaturePeaks) {
    const pidx = clamp01(p.index / 6);
    const peakX = lerp(-wHalf, wHalf, pidx);
    macro += gaussian2(x - peakX, z + 1.5, 0.8 + p.sigma * 0.8, 0.7 + p.sigma * 0.8) * p.amplitude * PEAK_SCALE;
  }

  // ── Layer 2: RIDGE STRUCTURE — sculpts macro into distinct ridges and valleys
  // ridgeMod near 1 = ridge crest lifted; near 0 = valley carved in.
  // This is what creates actual valley depth — previous ridgeNoise only added
  // roughness, it never subtracted. The sculpt factor (0.80→1.20) gives a
  // 1.5× crest:valley relief ratio across the whole terrain.
  const ridgeMod = ridgeLayer(x, z);
  let h = macro * (0.80 + ridgeMod * 0.40);

  // ── Layer 3: MICRO DETAIL — light texture, preserves zone readability
  // Reduced weight vs previous (was 0.4+h*0.10 scale) so fine detail
  // doesn't overwhelm the newly meaningful ridge/valley structure.
  h += ridgeNoise(x, z) * (0.18 + h * 0.03);

  // ── Left-face erosion (user's left = positive X)
  h += erosionHeight(x, z);

  // ── Fine surface noise (small-scale texture)
  const n = noise2(x, z) * 0.25;

  // ── Island falloff — steeper power (2.5 vs 2.0) creates a sharper coastline
  // so the terrain reads as a distinct mountain range rather than a bell curve.
  const dist  = Math.sqrt(x * x + z * z * 1.4);
  const mask  = Math.max(0, 1 - Math.pow(dist / ISLAND_RADIUS, 2.5));
  const cliff = Math.pow(mask, 0.40) * CLIFF_BOOST;

  let finalH = Math.max(0, (h + n) * mask * cliff);
  finalH = applySoftCeiling(finalH);

  return finalH;
}
