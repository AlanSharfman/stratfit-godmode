import { noise2D } from "./noise";

export function terrainHeight(x: number, y: number, seed: number) {
    // ── Primary peaks ──
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

    const base = peak1 + peak2 + peak3 + peak4 + peak5 + valley1 + valley2 + spine;

    // ── Multi-octave noise for detail ──
    const n1 = noise2D(x * 4, y * 4, seed) * 0.12;
    const n2 = noise2D(x * 8 + 1.3, y * 8 + 2.7, seed) * 0.06;
    const n3 = noise2D(x * 16 + 5.1, y * 16 + 3.9, seed) * 0.03;

    return base + n1 + n2 + n3;
}
