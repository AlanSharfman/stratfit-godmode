// src/terrain/layers/StructuralPressureHeatmap.tsx
// STRATFIT — Structural Pressure Heatmap (Simulation Volatility)
// Phase 10 God Mode Overlays Lock

import { useSimulationSelectors } from "@/core/selectors/useSimulationSelectors";
import { useGodModeStore } from "@/core/store/useGodModeStore";
import { useMemo } from "react";
import { MeshStandardMaterial } from "three";

export default function StructuralPressureHeatmap() {
    const { volatility } = useSimulationSelectors();
    const enabled = useGodModeStore((s) => s.enabled && s.showPressure);

    const material = useMemo(
        () =>
            new MeshStandardMaterial({
                color: volatility > 0.5 ? "#7f1d1d" : "#0f172a",
                transparent: true,
                opacity: 0.18 + volatility * 0.25,
            }),
        [volatility]
    );

    if (!enabled) return null;

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
            <planeGeometry args={[420, 420, 1, 1]} />
            <primitive object={material} attach="material" />
        </mesh>
    );
}
