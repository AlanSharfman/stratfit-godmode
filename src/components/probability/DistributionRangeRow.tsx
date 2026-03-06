import React from "react"

type Props = {
  label: string
  p10: string
  p50: string
  p90: string
}

export default function DistributionRangeRow({ label, p10, p50, p90 }: Props) {
  return (
    <div
      style={{
        border: "1px solid rgba(54, 226, 255, 0.18)",
        background: "rgba(8, 20, 38, 0.58)",
        borderRadius: 12,
        padding: "12px 14px",
      }}
    >
      <div style={{ color: "#dff8ff", fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        <div>
          <div style={{ color: "rgba(220,240,255,0.62)", fontSize: 11 }}>P10</div>
          <div style={{ color: "#aef6ff", fontWeight: 600 }}>{p10}</div>
        </div>
        <div>
          <div style={{ color: "rgba(220,240,255,0.62)", fontSize: 11 }}>P50</div>
          <div style={{ color: "#aef6ff", fontWeight: 600 }}>{p50}</div>
        </div>
        <div>
          <div style={{ color: "rgba(220,240,255,0.62)", fontSize: 11 }}>P90</div>
          <div style={{ color: "#aef6ff", fontWeight: 600 }}>{p90}</div>
        </div>
      </div>
    </div>
  )
}
