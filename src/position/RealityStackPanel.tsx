import React from "react"

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0" }}>
      <span style={{ opacity: 0.75 }}>{label}</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, letterSpacing: 0.8, opacity: 0.65, marginBottom: 6 }}>
        {title.toUpperCase()}
      </div>
      {children}
    </div>
  )
}

export default function RealityStackPanel() {
  // NOTE: placeholders by design for this phase.
  // Next phase: wire to canonical metrics output for Position.
  return (
    <div
      style={{
        width: 320,
        padding: 14,
        borderRadius: 14,
        background: "rgba(8, 12, 16, 0.62)",
        border: "1px solid rgba(0, 224, 255, 0.18)",
        boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
        color: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 10 }}>
        Position — Reality Stack
      </div>

      <Section title="Financial">
        <Row label="ARR / Revenue" value="—" />
        <Row label="Gross Margin" value="—" />
        <Row label="Net Burn" value="—" />
        <Row label="Runway" value="—" />
        <Row label="Cash" value="—" />
      </Section>

      <Section title="Unit Economics">
        <Row label="CAC" value="—" />
        <Row label="LTV" value="—" />
        <Row label="Payback" value="—" />
        <Row label="Churn / NRR" value="—" />
      </Section>

      <Section title="Operations">
        <Row label="Throughput" value="—" />
        <Row label="Delivery Tempo" value="—" />
        <Row label="Opex Efficiency" value="—" />
      </Section>

      <Section title="Strategy">
        <Row label="Focus Score" value="—" />
        <Row label="Execution Risk" value="—" />
        <Row label="Funding Pressure" value="—" />
      </Section>

      <div style={{ fontSize: 11, opacity: 0.6 }}>
        Hover/click beacons to populate the narrative panel.
      </div>
    </div>
  )
}
