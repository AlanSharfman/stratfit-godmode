import React from "react"
import ProbabilityBandPill from "./ProbabilityBandPill"

export interface ProbabilityMetric {
  label: string
  value: string
  probability?: number
}

interface Props {
  metrics: ProbabilityMetric[]
  simulationCount?: number
  modelConfidence?: string
  dataCompleteness?: string
}

export default function ProbabilitySummaryCard({
  metrics,
  simulationCount,
  modelConfidence,
  dataCompleteness,
}: Props) {
  return (
    <section
      style={{
        background: "rgba(8, 20, 38, 0.82)",
        border: "1px solid rgba(54, 226, 255, 0.28)",
        boxShadow: "0 0 24px rgba(0, 200, 255, 0.16)",
        backdropFilter: "blur(10px)",
        borderRadius: 16,
        padding: 18,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(34,211,238,0.5)", marginBottom: 6 }}>
          Probability Overview
        </div>
        <div style={{ color: "rgba(220,240,255,0.60)", fontSize: 12, lineHeight: 1.5 }}>
          Scenario outcomes are modelled as probability ranges, not guaranteed results.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        {metrics.map((metric) => (
          <div
            key={metric.label}
            style={{
              border: "1px solid rgba(54, 226, 255, 0.14)",
              borderRadius: 10,
              padding: "10px 12px",
              background: "rgba(8, 20, 38, 0.52)",
            }}
          >
            <div style={{ color: "rgba(220,240,255,0.55)", fontSize: 10, fontWeight: 600, letterSpacing: "0.04em" }}>
              {metric.label}
            </div>
            <div style={{ color: "#dff8ff", fontSize: 18, fontWeight: 700, marginTop: 4 }}>
              {metric.value}
            </div>
            {typeof metric.probability === "number" && (
              <div style={{ marginTop: 6 }}>
                <ProbabilityBandPill value={metric.probability} compact />
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 12,
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          color: "rgba(220,240,255,0.45)",
          fontSize: 11,
          letterSpacing: "0.02em",
        }}
      >
        {typeof simulationCount === "number" && (
          <span>Simulations: <strong style={{ color: "rgba(220,240,255,0.65)" }}>{simulationCount.toLocaleString()}</strong></span>
        )}
        {modelConfidence && (
          <span>Confidence: <strong style={{ color: "rgba(220,240,255,0.65)" }}>{modelConfidence}</strong></span>
        )}
        {dataCompleteness && (
          <span>Data: <strong style={{ color: "rgba(220,240,255,0.65)" }}>{dataCompleteness}</strong></span>
        )}
      </div>
    </section>
  )
}
