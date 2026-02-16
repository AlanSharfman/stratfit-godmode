// src/terrain/layers/PathLayer.tsx
// STRATFIT — Path Visualization Layer
// Phase 4 Path Engine Lock

import { usePathStore } from "@/core/store/usePathStore";
import { Line } from "@react-three/drei";

export default function PathLayer() {
    const paths = usePathStore((s) => s.paths);

    return (
        <>
            {paths.map((path) => (
                <Line
                    key={path.id}
                    points={path.nodes.map((n) => [n.x, n.y + 0.2, n.time / 6])}
                    color="#22d3ee"
                    lineWidth={2}
                />
            ))}
        </>
    );
}
