import { normToWorld } from "@/spatial/SpatialProjector";
import type { PathNode } from "@/spatial/types";
import { sampleTerrainHeight } from "@/terrain/buildTerrain";
import { getStmEnabled, sampleStmDisplacement } from "@/render/stm/stmRuntime";
import type { HeightSampler } from "@/terrain/corridorTopology";

export function nodesToWorldXZ(
    nodes: PathNode[],
    seed: number,
): { points: { x: number; z: number }[]; getHeightAt: HeightSampler } {
    const points = nodes.map((n) => {
        const world = normToWorld(n.coord);
        return { x: world.x, z: world.y }; // projector "y" → ground Z
    });

    const getHeightAt: HeightSampler = (worldX, worldZ) => {
        const base = sampleTerrainHeight(worldX, worldZ, seed);
        const stm = getStmEnabled() ? sampleStmDisplacement(worldX, worldZ) : 0;
        return base + stm;
    };

    return { points, getHeightAt };
}
