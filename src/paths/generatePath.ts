import type { PathNode } from "@/spatial/types";

export function generateP50Nodes(): PathNode[] {
  const nodes: PathNode[] = [];

  for (let i = 0; i <= 40; i++) {
    const t = i / 40;

    const lateral =
      0.05 * Math.sin(t * Math.PI * 2) +
      0.03 * Math.sin(t * Math.PI * 6);

    nodes.push({
      id: `p50_${i}`,
      percentile: 50,
      t,
      coord: {
        x: t,
        y: 0,
        z: 0.45 + lateral,
      },
      anchorId: `p50_${i}`,
    });
  }

  return nodes;
}

