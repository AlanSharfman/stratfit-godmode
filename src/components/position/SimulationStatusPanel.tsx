import React from "react"
import type { Phase1Scenario, SimulationStatus } from "@/state/phase1ScenarioStore"

interface Props {
  scenario: Phase1Scenario | null | undefined
  onRunSimulation?: () => void
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

const STATUS_COLORS: Record<SimulationStatus, string> = {
  draft: "#94a3b8",
  running: "#fbbf24",
  complete: "#22c55e",
  error: "#ef4444",
}

const STATUS_LABELS: Record<SimulationStatus, string> = {
  draft: "Draft",
  running: "Running\u2026",
  complete: "Complete",
  error: "Error",
}

export default function SimulationStatusPanel({ scenario, onRunSimulation }: Props) {
  const status: SimulationStatus = scenario?.status ?? "draft"
  const color = STATUS_COLORS[status]
  const label = STATUS_LABELS[status]

  return (
    <div style={PANEL} aria-label="Simulation Status">
      <div style={HEADING}>Simulation</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div style={{
          width: 10, height: 10, borderRadius: "50%",
          background: color,
          boxShadow: `0 0 6px ${color}`,
          animation: status === "running" ? "pulse 1.2s ease-in-out infinite" : undefined,
        }} />
        <span style={{ fontSize: 14, fontWeight: 600, color }}>{label}</span>
      </div>
      <div style={{ fontSize: 11, opacity: 0.5 }}>
        {status === "draft" && "Awaiting simulation run"}
        {status === "running" && "Simulation in progress\u2026"}
        {status === "complete" && "Results available"}
        {status === "error" && "Baseline required \u2014 go to Initiate"}
      </div>
      {(status === "draft" || status === "error") && onRunSimulation && (
        <button
          type="button"
          onClick={onRunSimulation}
          style={{
            marginTop: 8, padding: "6px 14px", borderRadius: 8, border: "none",
            background: "linear-gradient(135deg, #22d3ee, #06b6d4)",
            color: "#000", fontWeight: 600, fontSize: 11, cursor: "pointer",
          }}
        >
          Run Simulation
        </button>
      )}
      {status === "running" && (
        <style>{`@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }`}</style>
      )}
    </div>
  )
}
