// src/terrain/layers/LiquidityTrajectoryLayer.tsx
// STRATFIT — Liquidity Trajectory Layer
// Phase 6 Visual Integration Lock

import { useStratfitStore } from "@/core/store/useStratfitStore";
import { Line } from "@react-three/drei";

export default function LiquidityTrajectoryLayer() {
    const cashSeries = useStratfitStore((s) => s.liquidity.cashDistribution);

    if (!cashSeries || cashSeries.length === 0) return null;

    const points: [number, number, number][] = cashSeries.map((c, i) => [
        i * 2 - 36,
        Math.max(0, c / 500000),
        0,
    ]);

    return <Line points={points} color="#34d399" lineWidth={2} />;
}
