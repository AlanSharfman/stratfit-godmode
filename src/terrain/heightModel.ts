import { noise2D } from "./noise";

/**
 * Ridge sharpening function — accentuates peaks and valleys.
 * sign(h) * pow(abs(h), 1.4) creates sharper ridgelines and deeper troughs.
 */
function sharpen(h: number): number {
    return Math.sign(h) * Math.pow(Math.abs(h), 1.4);
}

export function terrainHeight(x: number, y: number, seed: number) {
    // ══════════════════════════════════════════════════════════════════════
    // MULTI-SCALE TERRAIN GENERATION
    // ══════════════════════════════════════════════════════════════════════
    // Layer 1: Primary ridgelines (broadest features)
    // Layer 2: Secondary ridges (medium detail)
    // Layer 3: Micro relief (fine detail)
    // Final: Ridge sharpening for crisp peaks/valleys
    // ══════════════════════════════════════════════════════════════════════

    // ── Primary ridgelines (scale 1.1 - broadest features) ──
    const primary = noise2D(x * 1.1, y * 1.1, seed) * 1.0;

    // ── Primary peaks (Gaussian bumps at fixed positions) ──
    const peak1 = Math.exp(-((x - 0.28) ** 2 + (y - 0.22) ** 2) * 3.5) * 1.0;
    const peak2 = Math.exp(-((x - 0.72) ** 2 + (y - 0.35) ** 2) * 2.8) * 0.85;
    const peak3 = Math.exp(-((x - 0.50) ** 2 + (y - 0.65) ** 2) * 4.0) * 0.70;
    const peak4 = Math.exp(-((x - 0.15) ** 2 + (y - 0.55) ** 2) * 5.0) * 0.55;
    const peak5 = Math.exp(-((x - 0.82) ** 2 + (y - 0.70) ** 2) * 4.5) * 0.60;

    // ── Valleys / troughs (negative contributions) ──
    const valley1 = -Math.exp(-((x - 0.45) ** 2 + (y - 0.40) ** 2) * 6.0) * 0.35;
    const valley2 = -Math.exp(-((x - 0.60) ** 2 + (y - 0.15) ** 2) * 5.0) * 0.25;

    // ── Ridgeline spine (elongated Gaussian along x) ──
    const spine = Math.exp(-((y - 0.38) ** 2) * 4.0) * 0.30;

    // ── Secondary ridges (scale 3.8 - medium detail) ──
    const secondary = noise2D(x * 3.8, y * 3.8, seed) * 0.5;

    // ── Micro relief (scale 14.0 - fine surface detail) ──
    const micro = noise2D(x * 14.0, y * 14.0, seed) * 0.15;

    // ── Additional detail octaves ──
    const n2 = noise2D(x * 8 + 1.3, y * 8 + 2.7, seed) * 0.06;
    const n3 = noise2D(x * 16 + 5.1, y * 16 + 3.9, seed) * 0.03;

    // Combine all layers
    const base = peak1 + peak2 + peak3 + peak4 + peak5 + valley1 + valley2 + spine;
    const h = primary + base + secondary + micro + n2 + n3;

    // Apply ridge sharpening for crisp peaks and deeper valleys
    return sharpen(h);
}
