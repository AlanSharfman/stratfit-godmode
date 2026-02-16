// src/components/kpi/KpiStrip.tsx
// STRATFIT — KPI Strip (Universal)
// Phase 7 Render Adapter Lock

import { useKpiAdapter } from "@/core/adapters/useKpiAdapter";

export default function KpiStrip() {
    const kpis = useKpiAdapter();

    return (
        <div className="kpiStrip">
            {kpis.map((k) => (
                <div key={k.id} className="kpiCard">
                    <div className="kpiLabel">{k.label}</div>
                    <div className="kpiValue">{k.value}</div>
                </div>
            ))}
        </div>
    );
}
