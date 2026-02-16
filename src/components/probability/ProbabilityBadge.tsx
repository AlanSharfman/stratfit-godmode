import React from "react";

export default function ProbabilityBadge({
    probability,
}: {
    probability?: number;
}) {
    if (probability === undefined) return null;

    const pct = Math.round(probability * 100);

    return (
        <div
            style={{
                fontSize: 11,
                padding: "2px 6px",
                borderRadius: 6,
                background: "rgba(34,211,238,0.08)",
                border: "1px solid rgba(34,211,238,0.25)",
                color: "#67e8f9",
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                lineHeight: 1.2,
            }}
        >
            {pct}% survival
        </div>
    );
}
