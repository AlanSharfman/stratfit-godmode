// src/terrain/layers/StrategicSignalLayer.tsx
// STRATFIT — Strategic Signal Layer (Probability-Aware Markers)
// Phase 10 God Mode Overlays Lock

import { useSimulationSelectors } from "@/core/selectors/useSimulationSelectors";
import { useGodModeStore } from "@/core/store/useGodModeStore";
import { Html } from "@react-three/drei";

export default function StrategicSignalLayer() {
    const { survivalProbability, confidenceIndex } = useSimulationSelectors();
    const enabled = useGodModeStore((s) => s.enabled && s.showSignals);

    if (!enabled) return null;

    return (
        <>
            <Html position={[-18, 9, 6]} center>
                <div className="godSignal">
                    {(survivalProbability * 100).toFixed(0)}% Survival
                </div>
            </Html>

            <Html position={[18, 10, 8]} center>
                <div className="godSignal alt">
                    {(confidenceIndex * 100).toFixed(0)}% Confidence
                </div>
            </Html>
        </>
    );
}
