import React, { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { PositionKpis } from "@/pages/position/overlays/positionState"
import type { CompanyStage, BenchmarkComparison } from "@/engine/networkBenchmarks"
import { compareToBenchmarks, detectStage, getBenchmarkProfile } from "@/engine/networkBenchmarks"

interface BenchmarkPanelProps {
  kpis: PositionKpis
  compact?: boolean
}

const STAGE_OPTIONS: { value: CompanyStage; label: string }[] = [
  { value: "pre-seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series-a", label: "Series A" },
  { value: "series-b", label: "Series B" },
  { value: "growth", label: "Growth" },
]

function fmtVal(v: number, kpi: string): string {
  if (kpi === "growth" || kpi === "churn" || kpi === "grossMargin") return `${v.toFixed(1)}%`
  if (kpi === "runway") return `${v.toFixed(0)} mo`
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

const VERDICT_COLORS = {
  top: { bg: "rgba(34,211,238,0.06)", border: "rgba(34,211,238,0.15)", text: "#22d3ee", barBg: "#22d3ee" },
  above: { bg: "rgba(52,211,153,0.06)", border: "rgba(52,211,153,0.12)", text: "#34d399", barBg: "#34d399" },
  median: { bg: "rgba(251,191,36,0.04)", border: "rgba(251,191,36,0.08)", text: "#fbbf24", barBg: "#fbbf24" },
  below: { bg: "rgba(248,113,113,0.04)", border: "rgba(248,113,113,0.08)", text: "#f87171", barBg: "#f87171" },
}

export default React.memo(function BenchmarkPanel({ kpis, compact = false }: BenchmarkPanelProps) {
  const autoStage = useMemo(() => detectStage(kpis), [kpis])
  const [selectedStage, setSelectedStage] = useState<CompanyStage>(autoStage)
  const profile = useMemo(() => getBenchmarkProfile(selectedStage), [selectedStage])
  const comparisons = useMemo(() => compareToBenchmarks(kpis, selectedStage), [kpis, selectedStage])

  const overallPercentile = useMemo(() =>
    Math.round(comparisons.reduce((sum, c) => sum + c.percentile, 0) / comparisons.length)
  , [comparisons])

  const overallVerdict = overallPercentile >= 75 ? "Top Quartile" : overallPercentile >= 50 ? "Above Median" : overallPercentile >= 25 ? "Median" : "Below Median"
  const overallColor = overallPercentile >= 75 ? "#22d3ee" : overallPercentile >= 50 ? "#34d399" : overallPercentile >= 25 ? "#fbbf24" : "#f87171"

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(34,211,238,0.5)", marginBottom: 8 }}>
          Network Intelligence
        </div>

        {/* Stage selector */}
        <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
          {STAGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedStage(opt.value)}
              style={{
                padding: "4px 10px", borderRadius: 4, fontSize: 10, fontWeight: 600,
                background: selectedStage === opt.value ? "rgba(34,211,238,0.1)" : "rgba(200,220,240,0.03)",
                border: `1px solid ${selectedStage === opt.value ? "rgba(34,211,238,0.2)" : "rgba(200,220,240,0.06)"}`,
                color: selectedStage === opt.value ? "#22d3ee" : "rgba(200,220,240,0.35)",
                cursor: "pointer",
              }}
            >
              {opt.label}
              {opt.value === autoStage && " *"}
            </button>
          ))}
        </div>

        {/* Overall score */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 14px", borderRadius: 8,
          background: "rgba(10,18,32,0.5)",
          border: "1px solid rgba(34,211,238,0.08)",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            border: `2px solid ${overallColor}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: overallColor,
            fontFamily: "ui-monospace, monospace",
          }}>
            {overallPercentile}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(200,220,240,0.8)" }}>
              {overallVerdict}
            </div>
            <div style={{ fontSize: 10, color: "rgba(200,220,240,0.3)" }}>
              vs {profile.sampleSize} {profile.label} companies
            </div>
          </div>
        </div>
      </div>

      {/* KPI comparisons */}
      <div style={{ display: "flex", flexDirection: "column", gap: compact ? 6 : 10 }}>
        {comparisons.map((comp) => {
          const c = VERDICT_COLORS[comp.verdict]
          return (
            <div key={comp.kpi} style={{
              padding: compact ? "8px 10px" : "10px 14px", borderRadius: 6,
              background: c.bg, border: `1px solid ${c.border}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(200,220,240,0.7)" }}>{comp.label}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: c.text }}>{comp.percentile}th</span>
              </div>
              {/* Percentile bar */}
              <div style={{ height: 4, borderRadius: 2, background: "rgba(200,220,240,0.04)", overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${comp.percentile}%` }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  style={{ height: "100%", borderRadius: 2, background: c.barBg, opacity: 0.6 }}
                />
              </div>
              {!compact && (
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 9, color: "rgba(200,220,240,0.25)" }}>
                  <span>You: {fmtVal(comp.yourValue, comp.kpi)}</span>
                  <span>Median: {fmtVal(comp.p50, comp.kpi)}</span>
                  <span>Top 10%: {fmtVal(comp.top10, comp.kpi)}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Disclaimer */}
      <div style={{ marginTop: 12, fontSize: 9, color: "rgba(200,220,240,0.15)", lineHeight: 1.5 }}>
        Based on anonymized data from {profile.sampleSize} {profile.label}-stage companies. Benchmarks are indicative.
      </div>
    </div>
  )
})
