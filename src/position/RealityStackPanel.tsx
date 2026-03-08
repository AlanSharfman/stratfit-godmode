// src/position/RealityStackPanel.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Reality Stack Panel (Phase 300)
//
// Wired to live KPIs + Risk Intelligence.
// Reads phase1ScenarioStore → selectKpis + useRiskIntelligence.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react"
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore"
import { selectKpis } from "@/selectors/kpiSelectors"
import { useRiskIntelligence } from "@/hooks/useRiskIntelligence"
import { getRiskBandColor } from "@/engine/riskIntelligenceEngine"

// ── Formatting helpers ──
function fmtK(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

function fmtPct(n: number): string {
  const v = Math.abs(n) > 1 ? n : n * 100
  return `${v.toFixed(1)}%`
}

function fmtMo(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—"
  return `${n.toFixed(1)} mo`
}

// ── Sub-components ──
function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0" }}>
      <span style={{ opacity: 0.75 }}>{label}</span>
      <span style={{ fontVariantNumeric: "tabular-nums", color: color ?? "inherit" }}>{value}</span>
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
  const activeScenarioId = usePhase1ScenarioStore((s) => s.activeScenarioId)
  const scenarios = usePhase1ScenarioStore((s) => s.scenarios)

  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === activeScenarioId) ?? null,
    [scenarios, activeScenarioId],
  )

  const kpis = useMemo(() => {
    if (!activeScenario?.simulationResults) return null
    return selectKpis(activeScenario.simulationResults.kpis)
  }, [activeScenario])

  const { intelligence } = useRiskIntelligence()

  const riskColor = intelligence ? getRiskBandColor(intelligence.band) : "inherit"

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
        <Row label="ARR / Revenue" value={kpis ? fmtK(kpis.arr) : "—"} />
        <Row label="Gross Margin" value={kpis ? fmtPct(kpis.grossMargin) : "—"} />
        <Row label="Runway" value={kpis ? fmtMo(kpis.runwayMonths) : "—"} />
        <Row label="Burn Rate" value={kpis ? fmtK(kpis.burnMonthly) + "/mo" : "—"} />
        <Row label="Churn Rate" value={kpis ? fmtPct(kpis.churnRate) : "—"} />
      </Section>

      <Section title="Operations">
        <Row label="Headcount" value={kpis ? String(kpis.headcount) : "—"} />
        <Row label="ARPA" value={kpis ? fmtK(kpis.arpa) : "—"} />
        <Row label="Cash Position" value={kpis ? fmtK(kpis.cashOnHand) : "—"} />
      </Section>

      <Section title="Risk Intelligence">
        <Row
          label="Risk Score"
          value={intelligence ? `${intelligence.overallScore} · ${intelligence.band}` : "—"}
          color={riskColor}
        />
        <Row
          label="Survival"
          value={intelligence ? `${(intelligence.survivalProbability * 100).toFixed(0)}%` : "—"}
        />
        <Row
          label="Execution"
          value={intelligence ? intelligence.systemState.execution : "—"}
        />
        <Row
          label="Financial"
          value={intelligence ? intelligence.systemState.financial : "—"}
        />
      </Section>

      <div style={{ fontSize: 11, opacity: 0.6 }}>
        {intelligence
          ? intelligence.observations[0] ?? "System nominal."
          : "Run a simulation to populate."}
      </div>
    </div>
  )
}
