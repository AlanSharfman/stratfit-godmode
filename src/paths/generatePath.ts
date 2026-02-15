import type { PathNode } from "@/spatial/types";

export function generateP50Nodes(): PathNode[] {
    const nodes: PathNode[] = [];

    for (let i = 0; i <= 20; i++) {
        const t = i / 20;

        nodes.push({
            id: `p50_t${t.toFixed(2)}`,
            percentile: 50,
            t,
            coord: {
                x: t,
                y: 0,
                z: 0.4 + Math.sin(t * Math.PI) * 0.05
            },
            anchorId: `p50_t${t.toFixed(2)}`
        });
    }

    return nodes;
}
