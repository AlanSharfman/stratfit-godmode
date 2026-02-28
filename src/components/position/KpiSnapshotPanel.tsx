import React from "react"
import type { Baseline } from "@/types/baseline"
import type { SimulationKpis } from "@/state/phase1ScenarioStore"

const DASH = "\u2014"

function fmt(n: number | null | undefined, suffix = ""): string {
  if (n == null || !Number.isFinite(n)) return DASH
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M${suffix}`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K${suffix}`
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}${suffix}`
}

function pct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return DASH
  return `${(n * 100).toFixed(1)}%`
}

interface Props {
  baseline: Baseline | null | undefined
  simulationKpis?: SimulationKpis | null
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

const GRID: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "6px 16px",
  fontSize: 11,
}

const LABEL: React.CSSProperties = { opacity: 0.5 }
const VALUE: React.CSSProperties = { textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }

export default function KpiSnapshotPanel({ baseline, simulationKpis }: Props) {
  // Prefer simulation KPIs when available, fall back to baseline
  const k = simulationKpis
  const cash = k?.cash ?? baseline?.cash ?? null
  const burn = k?.monthlyBurn ?? baseline?.monthlyBurn ?? null
  const revenue = k?.revenue ?? baseline?.revenue ?? null
  const grossMargin = k?.grossMargin ?? baseline?.grossMargin ?? null
  const growth = k?.growthRate ?? baseline?.growthRate ?? null
  const churn = k?.churnRate ?? baseline?.churnRate ?? null
  const headcount = k?.headcount ?? baseline?.headcount ?? null
  const runway = k?.runway ?? (cash != null && burn != null && burn > 0 ? Math.round(cash / burn) : null)

  return (
    <div style={PANEL} aria-label="KPI Snapshot">
      <div style={HEADING}>KPI Snapshot</div>
      <div style={GRID}>
        <span style={LABEL}>Cash</span>
        <span style={VALUE}>{fmt(cash)}</span>

        <span style={LABEL}>Revenue</span>
        <span style={VALUE}>{fmt(revenue)}</span>

        <span style={LABEL}>Burn</span>
        <span style={VALUE}>{fmt(burn, "/mo")}</span>

        <span style={LABEL}>Runway</span>
        <span style={VALUE}>{runway != null ? `${runway}mo` : DASH}</span>

        <span style={LABEL}>Gross Margin</span>
        <span style={VALUE}>{pct(grossMargin)}</span>

        <span style={LABEL}>Growth</span>
        <span style={VALUE}>{pct(growth)}</span>

        <span style={LABEL}>Churn</span>
        <span style={VALUE}>{pct(churn)}</span>

        <span style={LABEL}>Headcount</span>
        <span style={VALUE}>{headcount != null ? headcount : DASH}</span>
      </div>
    </div>
  )
}
