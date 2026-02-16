// src/terrain/TerrainOverlayHost.tsx
// STRATFIT — Global Overlay Layers Host
// Phase 10 God Mode Overlays Lock

import StrategicSignalLayer from "./layers/StrategicSignalLayer";
import StructuralPressureHeatmap from "./layers/StructuralPressureHeatmap";
import PathLayer from "./layers/PathLayer";
import LiquidityTrajectoryLayer from "./layers/LiquidityTrajectoryLayer";
import ValuationBandLayer from "./layers/ValuationBandLayer";
import SurvivalSignal from "./layers/SurvivalSignal";
import InterventionGhostLayer from "./layers/InterventionGhostLayer";

export default function TerrainOverlayHost() {
    return (
        <>
            <StructuralPressureHeatmap />
            <PathLayer />
            <InterventionGhostLayer />
            <LiquidityTrajectoryLayer />
            <ValuationBandLayer />
            <StrategicSignalLayer />
            <SurvivalSignal />
        </>
    );
}
