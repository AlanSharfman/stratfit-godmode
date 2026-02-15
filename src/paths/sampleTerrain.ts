import { terrainHeight } from "@/terrain/heightModel";

export function sampleHeight(nx: number, ny: number, seed: number) {
    return terrainHeight(nx, ny, seed) * 60;
}
