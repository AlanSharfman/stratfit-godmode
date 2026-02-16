import React from "react";
import type { ProbabilityBand } from "@/core/probability/probabilityTypes";

export default function ValuationBand({ band }: { band: ProbabilityBand }) {
    return (
        <div style={{ display: "flex", gap: 8, fontSize: 12 }}>
            <span>P10: {band.p10.toLocaleString()}</span>
            <span style={{ color: "#67e8f9", fontWeight: 600 }}>
                P50: {band.p50.toLocaleString()}
            </span>
            <span>P90: {band.p90.toLocaleString()}</span>
        </div>
    );
}
