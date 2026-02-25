import React, { useMemo } from "react"
import { useScenarioStore } from "@/state/scenarioStore"
import { useSimulationStore } from "@/state/simulationStore"
import { selectKpisFromResults, type CanonicalKpis } from "@/simulation/kpiSelectors"

type RunLike = {
  scenarioId?: string | null
  results?: any
  horizonMonths?: number
  iterations?: number
}

function pickBaselineRun(activeRun: RunLike | null, runsAny: unknown): RunLike | null {
  if (activeRun && (!activeRun.scenarioId || activeRun.scenarioId === "baseline")) return activeRun

  if (Array.isArray(runsAny)) {
    return (
      (runsAny as RunLike[]).find((r) => !r?.scenarioId || r?.scenarioId === "baseline") ?? null
    )
  }

  if (runsAny && typeof runsAny === "object") {
    const map = runsAny as Record<string, RunLike>
    if (map["baseline"]) return map["baseline"]
  }

  return null
}

function pickScenarioRun(
  scenarioId: string | null,
  activeRun: RunLike | null,
  runsAny: unknown
): RunLike | null {
  if (!scenarioId) return null

  if (activeRun?.scenarioId && String(activeRun.scenarioId) === String(scenarioId)) return activeRun

  if (Array.isArray(runsAny)) {
    return (
      (runsAny as RunLike[]).find((r) => String(r?.scenarioId ?? "") === String(scenarioId)) ?? null
    )
  }

  if (runsAny && typeof runsAny === "object") {
    const map = runsAny as Record<string, RunLike>
    if (map[String(scenarioId)]) return map[String(scenarioId)]
  }

  return null
}

function fmtMoney(n: number | null) {
  if (n === null) return "—"
  const abs = Math.abs(n)
  const sign = n < 0 ? "-" : ""
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(2)}K`
  return `${sign}${abs.toFixed(0)}`
}

function fmtPct(p: number | null) {
  if (p === null) return "—"
  return `${(p * 100).toFixed(0)}%`
}

function fmtNum(n: number | null) {
  if (n === null) return "—"
  return `${n.toFixed(1)}`
}

function delta(a: number | null, b: number | null) {
  if (a === null || b === null) return { abs: null, pct: null }
  const abs = b - a
  const pct = a === 0 ? null : abs / a
  return { abs, pct }
}

export default function CompareKpiOverlay() {
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId)

  const status = useSimulationStore((s: any) => s.simulationStatus ?? null)
  const activeRun = useSimulationStore((s: any) => (s.activeRun ?? null) as RunLike | null)
  const runs = useSimulationStore((s: any) => s.runs ?? null)
  const runsByScenarioId = useSimulationStore((s: any) => s.runsByScenarioId ?? null)
  const runSource = runsByScenarioId ?? runs

  const baselineRun = useMemo(() => pickBaselineRun(activeRun, runSource), [activeRun, runSource])
  const scenarioRun = useMemo(
    () => pickScenarioRun(activeScenarioId, activeRun, runSource),
    [activeScenarioId, activeRun, runSource]
  )

  const baselineKpis: CanonicalKpis = useMemo(() => {
    if (status !== "completed" || !baselineRun?.results) {
      return {
        survivalProb: null,
        runwayMonths: null,
        burnMonthly: null,
        evP50: null,
        evP10: null,
        evP90: null,
      }
    }
    return selectKpisFromResults(baselineRun.results)
  }, [status, baselineRun?.results])

  const scenarioKpis: CanonicalKpis = useMemo(() => {
    if (status !== "completed" || !scenarioRun?.results) {
      return {
        survivalProb: null,
        runwayMonths: null,
        burnMonthly: null,
        evP50: null,
        evP10: null,
        evP90: null,
      }
    }
    return selectKpisFromResults(scenarioRun.results)
  }, [status, scenarioRun?.results])

  // Hide overlay when in base/baseline state (no meaningful compare)
  if (!activeScenarioId || activeScenarioId === "base") return null

  const rows = useMemo(() => {
    const a = baselineKpis
    const b = scenarioKpis

    return [
      {
        key: "survival",
        label: "Survival Probability",
        A: fmtPct(a.survivalProb),
        B: fmtPct(b.survivalProb),
        d: delta(a.survivalProb, b.survivalProb),
        dFmt: (d: any) => (d.abs === null ? "—" : `${(d.abs * 100).toFixed(0)} pp`),
      },
      {
        key: "runway",
        label: "Runway (months)",
        A: fmtNum(a.runwayMonths),
        B: fmtNum(b.runwayMonths),
        d: delta(a.runwayMonths, b.runwayMonths),
        dFmt: (d: any) => (d.abs === null ? "—" : `${d.abs.toFixed(1)} mo`),
      },
      {
        key: "burn",
        label: "Monthly Burn",
        A: fmtMoney(a.burnMonthly),
        B: fmtMoney(b.burnMonthly),
        d: delta(a.burnMonthly, b.burnMonthly),
        dFmt: (d: any) => (d.abs === null ? "—" : fmtMoney(d.abs)),
      },
      {
        key: "evp50",
        label: "Enterprise Value (P50)",
        A: fmtMoney(a.evP50),
        B: fmtMoney(b.evP50),
        d: delta(a.evP50, b.evP50),
        dFmt: (d: any) => (d.abs === null ? "—" : fmtMoney(d.abs)),
      },
      {
        key: "evband",
        label: "EV Band (P10–P90)",
        A: `${fmtMoney(a.evP10)} – ${fmtMoney(a.evP90)}`,
        B: `${fmtMoney(b.evP10)} – ${fmtMoney(b.evP90)}`,
        d: { abs: null, pct: null },
        dFmt: () => "—",
      },
    ]
  }, [baselineKpis, scenarioKpis])

  return (
    <div style={{ position: "absolute", top: 72, right: 16, width: 380, zIndex: 60 }}>
      <div
        style={{
          background: "rgba(0,0,0,0.55)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 14,
          padding: 12,
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 8 }}>
          Compare KPIs (Canonical)
        </div>

        <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
          Scenario: <span style={{ opacity: 0.95 }}>{String(activeScenarioId)}</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.25fr 0.75fr 0.75fr 0.65fr",
            gap: 8,
          }}
        >
          <div style={th}>Metric</div>
          <div style={th}>Baseline</div>
          <div style={th}>Scenario</div>
          <div style={th}>Δ</div>

          {rows.map((r) => (
            <React.Fragment key={r.key}>
              <div style={tdLabel}>{r.label}</div>
              <div style={td}>{r.A}</div>
              <div style={td}>{r.B}</div>
              <div style={tdDelta}>{r.dFmt(r.d)}</div>
            </React.Fragment>
          ))}
        </div>

        {baselineKpis.evP50 === null && scenarioKpis.evP50 === null && (
          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
            KPIs are null because selectKpisFromResults() is not yet bound to your canonical KPI builder.
            Wire the TODO_CANONICAL block in src/simulation/kpiSelectors.ts.
          </div>
        )}
      </div>
    </div>
  )
}

const th: React.CSSProperties = { fontSize: 12, opacity: 0.7 }
const td: React.CSSProperties = { fontSize: 12, opacity: 0.9 }
const tdLabel: React.CSSProperties = { fontSize: 12, opacity: 0.85 }
const tdDelta: React.CSSProperties = { fontSize: 12, opacity: 0.9 }
