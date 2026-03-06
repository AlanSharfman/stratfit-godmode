import React from "react"
import ProbabilityBandPill from "./ProbabilityBandPill"
import DistributionRangeRow from "./DistributionRangeRow"

export type ProbabilityMetric = {
  label: string
  value: string
  probability?: number
}

export type DistributionRange = {
  label: string
  p10: string
  p50: string
  p90: string
}

type Props = {
  metrics: ProbabilityMetric[]
  ranges?: DistributionRange[]
  simulationCount?: number
  modelConfidence?: string
  dataCompleteness?: string
  title?: string
  subtitle?: string
}

export default function ProbabilitySummaryCard({
  metrics,
  ranges = [],
  simulationCount,
  modelConfidence,
  dataCompleteness,
  title = "Probability Overview",
  subtitle = "Scenario outcomes are modelled as probability ranges, not guaranteed results.",
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
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <div style={{ color: "#dff8ff", fontSize: 18, fontWeight: 600 }}>{title}</div>
        <div style={{ color: "rgba(220,240,255,0.76)", fontSize: 13, marginTop: 4 }}>
          {subtitle}
        </div>
      </div>

      {!!metrics.length && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          {metrics.map((metric) => (
            <div
              key={metric.label}
              style={{
                border: "1px solid rgba(54, 226, 255, 0.16)",
                borderRadius: 12,
                padding: "12px 14px",
                background: "rgba(8, 20, 38, 0.52)",
              }}
            >
              <div style={{ color: "rgba(220,240,255,0.68)", fontSize: 12 }}>{metric.label}</div>
              <div style={{ color: "#dff8ff", fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                {metric.value}
              </div>
              {typeof metric.probability === "number" && (
                <div style={{ marginTop: 8 }}>
                  <ProbabilityBandPill value={metric.probability} compact />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!!ranges.length && (
        <div
          style={{
            marginTop: metrics.length ? 14 : 0,
            display: "grid",
            gap: 10,
          }}
        >
          {ranges.map((range) => (
            <DistributionRangeRow
              key={range.label}
              label={range.label}
              p10={range.p10}
              p50={range.p50}
              p90={range.p90}
            />
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: 14,
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          color: "rgba(220,240,255,0.76)",
          fontSize: 12,
        }}
      >
        {typeof simulationCount === "number" && (
          <span>Simulations Run: {simulationCount.toLocaleString()}</span>
        )}
        {modelConfidence && <span>Model Confidence: {modelConfidence}</span>}
        {dataCompleteness && <span>Data Completeness: {dataCompleteness}</span>}
      </div>
    </section>
  )
}
