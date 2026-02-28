import React from "react"
import type { BaselineV1 } from "@/onboard/baseline"

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
  baseline: BaselineV1 | null | undefined
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

export default function KpiSnapshotPanel({ baseline }: Props) {
  const fin = baseline?.financial
  const op = baseline?.operating

  const cash = fin?.cashOnHand ?? null
  const burn = fin?.monthlyBurn ?? null
  const arr = fin?.arr ?? null
  const grossMargin = fin?.grossMarginPct != null ? fin.grossMarginPct / 100 : null
  const growth = fin?.growthRatePct != null ? fin.growthRatePct / 100 : null
  const churn = op?.churnPct != null ? op.churnPct / 100 : null
  const headcount = fin?.headcount ?? null
  const runway = cash != null && burn != null && burn > 0 ? Math.round(cash / burn) : null

  return (
    <div style={PANEL} aria-label="KPI Snapshot">
      <div style={HEADING}>KPI Snapshot</div>
      <div style={GRID}>
        <span style={LABEL}>Cash</span>
        <span style={VALUE}>{fmt(cash)}</span>

        <span style={LABEL}>ARR</span>
        <span style={VALUE}>{fmt(arr)}</span>

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
