// src/pages/valuation/ValuationPage.tsx
// STRATFIT — Valuation Page (First-Class, Probability Bands)
// Nav Amendment C Lock

import PageShell from "@/layout/PageShell"
import { useSimulationSelectors } from "@/core/selectors/useSimulationSelectors";
import CommentaryPanel from "@/components/commentary/CommentaryPanel";
import KpiStrip from "@/components/kpi/KpiStrip";
import SystemProbabilityNotice from "@/components/system/ProbabilityNotice";
import ProvenanceBadge from "@/components/system/ProvenanceBadge";

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
        <PageShell title="Valuation" subtitle="Probability-weighted enterprise value across modelled futures.">
            <KpiStrip />

            <div style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 10,
                padding: "16px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
            }}>
                <Row label="Probability Band (Month 12)" value={`${fmtM(low)} — ${fmtM(mid)} — ${fmtM(high)}`} />
                <Row label="Survival Probability" value={`${(s.survivalProbability * 100).toFixed(0)}%`} />
                <Row label="Decision Confidence" value={`${(s.confidenceIndex * 100).toFixed(0)}%`} />
                <Row label="Volatility" value={`${(s.volatility * 100).toFixed(0)}%`} />
            </div>

            <CommentaryPanel />

            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 0 0' }}>
              <ProvenanceBadge />
            </div>

            <SystemProbabilityNotice />
        </PageShell>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{label}</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.88)", fontVariantNumeric: "tabular-nums" }}>{value}</span>
        </div>
    );
}
