// src/terrain/layers/SurvivalSignal.tsx
// STRATFIT — Survival Probability Signal
// Phase 6 Visual Integration Lock

import { useStratfitStore } from "@/core/store/useStratfitStore";
import { Html } from "@react-three/drei";

export default function SurvivalSignal() {
    const survival = useStratfitStore((s) => s.simulation.survivalProbability);

    return (
        <Html position={[0, 12, 10]} center>
            <div className="signalBox">
                {(survival * 100).toFixed(0)}% Survival
            </div>
        </Html>
    );
}
