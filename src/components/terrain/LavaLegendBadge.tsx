import React from "react";

export default function LavaLegendBadge(props: { intensity01: number }) {
  const i = Math.max(0, Math.min(1, props.intensity01));
  const pct = Math.round(i * 100);

  return (
    <div
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(0,0,0,0.30)",
        backdropFilter: "blur(10px)",
        fontSize: 12,
        opacity: 0.9,
        display: "inline-flex",
        gap: 8,
        alignItems: "center",
      }}
    >
      <span style={{ opacity: 0.75 }}>Divergence Pressure</span>
      <span style={{ opacity: 0.95 }}>{pct}%</span>
    </div>
  );
}
