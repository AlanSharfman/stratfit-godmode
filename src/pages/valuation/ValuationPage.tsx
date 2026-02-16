// src/pages/valuation/ValuationPage.tsx
// STRATFIT — Valuation Page (First-Class, Probability Bands)
// Nav Amendment C Lock

import { useSimulationSelectors } from "@/core/selectors/useSimulationSelectors";
import CommentaryPanel from "@/components/commentary/CommentaryPanel";
import KpiStrip from "@/components/kpi/KpiStrip";

function idx12(len: number) {
    return Math.max(0, Math.min(12, len - 1));
}
function fmtM(x: number) {
    return `$${Math.round(x / 1e6)}M`;
}

export default function ValuationPage() {
    const s = useSimulationSelectors();

    const i = idx12(s.valuationP50.length);
    const low = s.valuationLow[i] ?? 0;
    const mid = s.valuationP50[i] ?? 0;
    const high = s.valuationHigh[i] ?? 0;

    return (
        <div className="pageOverlay">
            <h1>Valuation</h1>

            <KpiStrip />

            <div className="panel">
                <div className="row">
                    <div className="k">Probability Band (Month 12)</div>
                    <div className="v">
                        {fmtM(low)} — {fmtM(mid)} — {fmtM(high)}
                    </div>
                </div>

                <div className="row">
                    <div className="k">Survival Probability</div>
                    <div className="v">{(s.survivalProbability * 100).toFixed(0)}%</div>
                </div>

                <div className="row">
                    <div className="k">Decision Confidence</div>
                    <div className="v">{(s.confidenceIndex * 100).toFixed(0)}%</div>
                </div>

                <div className="row">
                    <div className="k">Volatility</div>
                    <div className="v">{(s.volatility * 100).toFixed(0)}%</div>
                </div>
            </div>

            <CommentaryPanel />
        </div>
    );
}
