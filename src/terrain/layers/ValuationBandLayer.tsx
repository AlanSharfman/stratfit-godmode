// src/terrain/layers/ValuationBandLayer.tsx
// STRATFIT — Valuation Band Surface
// Phase 6 Visual Integration Lock

import { useCanonicalOutputStore } from "@/core/store/useCanonicalOutputStore";
import { Line } from "@react-three/drei";

export default function ValuationBandLayer() {
    const output = useCanonicalOutputStore((s) => s.output);
    if (!output) return null;

    const p50 = output.simulation.distributions.valuationP50;
    const p25 = output.simulation.distributions.valuationP25;
    const p75 = output.simulation.distributions.valuationP75;

    const toPoints = (arr: number[]): [number, number, number][] =>
        arr.map((v, i) => [i * 2 - 36, v / 2000000, 5]);

    return (
        <>
            <Line points={toPoints(p25)} color="#22d3ee" lineWidth={1} />
            <Line points={toPoints(p50)} color="#6366f1" lineWidth={2} />
            <Line points={toPoints(p75)} color="#22d3ee" lineWidth={1} />
        </>
    );
}
