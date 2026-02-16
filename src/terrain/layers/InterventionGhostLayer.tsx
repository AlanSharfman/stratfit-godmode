// src/terrain/layers/InterventionGhostLayer.tsx
// STRATFIT — Intervention Ghosting Layer
// Phase 10 God Mode Overlays Lock

import { useGodModeStore } from "@/core/store/useGodModeStore";
import { Line } from "@react-three/drei";
import { usePathStore } from "@/core/store/usePathStore";

export default function InterventionGhostLayer() {
    const enabled = useGodModeStore((s) => s.enabled && s.showGhosts);
    const paths = usePathStore((s) => s.paths);

    if (!enabled || paths.length === 0) return null;

    return (
        <>
            {paths.map((p) => (
                <Line
                    key={`${p.id}-ghost`}
                    points={p.nodes.map((n) => [n.x, n.y + 0.6, n.time / 6])}
                    color="#94a3b8"
                    lineWidth={1}
                    dashed
                />
            ))}
        </>
    );
}
