import React from "react";

export type DecisionOutcome = {
    survivalLeader: string;
    upsideLeader: string;
    riskAdjustedLeader: string;
};

export default function DecisionCard({ outcome }: { outcome: DecisionOutcome }) {
    return (
        <div
            style={{
                padding: 16,
                borderRadius: 10,
                border: "1px solid rgba(34,211,238,0.25)",
                background: "rgba(15,23,42,0.65)",
                backdropFilter: "blur(8px)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
            }}
        >
            <div style={{ fontWeight: 600, color: "#67e8f9" }}>
                Decision Summary
            </div>

            <div>Best for survival: <strong>{outcome.survivalLeader}</strong></div>
            <div>Best for upside: <strong>{outcome.upsideLeader}</strong></div>
            <div>Best risk-adjusted: <strong>{outcome.riskAdjustedLeader}</strong></div>
        </div>
    );
}
