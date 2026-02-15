import { noise2D } from "./noise";

export function terrainHeight(x: number, y: number, seed: number) {
    // Multi-ridge topology
    const ridge1 = Math.exp(-((x - 0.3) ** 2 + (y - 0.2) ** 2) * 4);
    const ridge2 = Math.exp(-((x - 0.7) ** 2 + (y + 0.1) ** 2) * 3);
    const ridge3 = Math.exp(-((x - 0.5) ** 2 + (y - 0.6) ** 2) * 5);

    const base = ridge1 * 0.6 + ridge2 * 0.5 + ridge3 * 0.4;

    const n = noise2D(x * 4, y * 4, seed) * 0.15;

    return base + n;
}
