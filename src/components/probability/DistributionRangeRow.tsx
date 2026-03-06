import React from "react"

interface Props {
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
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ color: "#dff8ff", fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
        {label}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        {[
          { band: "P10", val: p10 },
          { band: "P50", val: p50 },
          { band: "P90", val: p90 },
        ].map((d) => (
          <div key={d.band}>
            <div style={{ color: "rgba(220,240,255,0.50)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>
              {d.band}
            </div>
            <div style={{ color: "#aef6ff", fontWeight: 600, fontSize: 14, marginTop: 2 }}>
              {d.val}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
