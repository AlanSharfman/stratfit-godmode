import React from "react"
import type { Baseline } from "@/types/baseline"

type RiskLevel = "Low" | "Medium" | "High" | "Critical"

function deriveRisk(baseline: Baseline | null | undefined): { level: RiskLevel; color: string; factors: string[] } {
  if (!baseline) return { level: "Medium", color: "#fbbf24", factors: ["Baseline not loaded"] }

  const factors: string[] = []
  let score = 0

  // Runway check
  const runway = baseline.monthlyBurn > 0 ? baseline.cash / baseline.monthlyBurn : null
  if (runway != null && runway < 6) { score += 3; factors.push(`Runway < 6mo (${Math.round(runway)}mo)`) }
  else if (runway != null && runway < 12) { score += 1; factors.push(`Runway < 12mo (${Math.round(runway)}mo)`) }

  // Churn check (flat baseline stores decimal)
  const churnPct = baseline.churnRate * 100
  if (churnPct > 8) { score += 2; factors.push(`High churn (${churnPct.toFixed(1)}%)`) }
  else if (churnPct > 4) { score += 1; factors.push(`Elevated churn (${churnPct.toFixed(1)}%)`) }

  // Growth check
  const growthPct = baseline.growthRate * 100
  if (growthPct < 0) { score += 2; factors.push("Negative growth") }

  // Margin check
  const marginPct = baseline.grossMargin * 100
  if (marginPct < 40) { score += 1; factors.push(`Low margin (${marginPct.toFixed(1)}%)`) }

  if (factors.length === 0) factors.push("No elevated risk factors")

  if (score >= 5) return { level: "Critical", color: "#ef4444", factors }
  if (score >= 3) return { level: "High", color: "#f97316", factors }
  if (score >= 1) return { level: "Medium", color: "#fbbf24", factors }
  return { level: "Low", color: "#22c55e", factors }
}

interface Props {
  baseline: Baseline | null | undefined
}

const PANEL: React.CSSProperties = {
  padding: "14px 16px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  marginBottom: 12,
  fontSize: 13,
  fontFamily: "'Inter', system-ui, sans-serif",
  color: "#e2e8f0",
}

const HEADING: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "#22d3ee",
  marginBottom: 10,
}

export default function RiskIndicatorPanel({ baseline }: Props) {
  const { level, color, factors } = deriveRisk(baseline)

  return (
    <div style={PANEL} aria-label="Risk Indicator">
      <div style={HEADING}>Risk Assessment</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 10, height: 10, borderRadius: "50%",
          background: color,
          boxShadow: `0 0 6px ${color}`,
        }} />
        <span style={{ fontSize: 15, fontWeight: 700, color }}>{level}</span>
      </div>
      <ul style={{ margin: 0, padding: "0 0 0 16px", fontSize: 11, opacity: 0.6, lineHeight: 1.6 }}>
        {factors.map((f, i) => <li key={i}>{f}</li>)}
      </ul>
    </div>
  )
}
