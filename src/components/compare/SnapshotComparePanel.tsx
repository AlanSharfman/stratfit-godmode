// src/components/compare/SnapshotComparePanel.tsx
// STRATFIT — Step 21: Snapshot-driven side-by-side narrative + deltas overlay
// Reads persisted snapshots from localStorage; no new stores.

import React, { useEffect, useMemo, useState } from "react"
import { useScenarioStore } from "@/state/scenarioStore"
import { useSimulationStore } from "@/state/simulationStore"
import { buildDriverAnalysis } from "@/simulation/buildDriverAnalysis"
import { listDelta, loadSnapshot, saveSnapshot, type Snapshot } from "./snapshots"

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

function buildSnapshotFromRun(run: RunLike, scenarioId: string): Snapshot | null {
  if (!run?.results) return null

  // buildDriverAnalysis returns DriverRow[] = {label, impact}[]
  let driverLabels: string[] = []
  try {
    const rows = buildDriverAnalysis(run.results)
    driverLabels = rows.map((r) => r.label)
  } catch {
    // no drivers available
  }

  return {
    v: 1,
    scenarioId,
    savedAtIso: new Date().toISOString(),
    iterations: typeof run.iterations === "number" ? run.iterations : null,
    horizonMonths: typeof run.horizonMonths === "number" ? run.horizonMonths : null,
    primary: driverLabels,
    headwinds: [],
    opportunities: [],
    summary: driverLabels.length > 0
      ? [`Top driver: ${driverLabels[0]}`, `${driverLabels.length} drivers identified`, "Monte Carlo derived"]
      : ["No driver analysis available"],
  }
}

export default function SnapshotComparePanel() {
  const activeScenarioId = useScenarioStore((s) => s.activeScenarioId ?? null)

  // Compare needs a scenario selected to compare against baseline.
  if (!activeScenarioId || activeScenarioId === "base") return null

  const status = useSimulationStore((s: any) => s.simulationStatus ?? null)
  const activeRun = useSimulationStore((s: any) => (s.activeRun ?? null) as RunLike | null)
  const runs = useSimulationStore((s: any) => s.runs ?? null)
  const runsByScenarioId = useSimulationStore((s: any) => s.runsByScenarioId ?? null)
  const runSource = runsByScenarioId ?? runs

  const [baselineSnap, setBaselineSnap] = useState<Snapshot | null>(() => loadSnapshot("baseline"))
  const scenarioSnap = useMemo(() => loadSnapshot(String(activeScenarioId)), [activeScenarioId])

  // Ensure baseline snapshot exists — derive from completed baseline run once.
  useEffect(() => {
    if (baselineSnap) return
    if (status !== "completed") return

    const baselineRun = pickBaselineRun(activeRun, runSource)
    if (!baselineRun) return

    const snap = buildSnapshotFromRun(baselineRun, "baseline")
    if (!snap) return

    saveSnapshot(snap)
    setBaselineSnap(snap)
  }, [baselineSnap, status, activeRun, runSource])

  if (!scenarioSnap || !baselineSnap) return null

  const primaryDelta = useMemo(
    () => listDelta(baselineSnap.primary, scenarioSnap.primary),
    [baselineSnap.primary, scenarioSnap.primary]
  )

  const headwindsDelta = useMemo(
    () => listDelta(baselineSnap.headwinds, scenarioSnap.headwinds),
    [baselineSnap.headwinds, scenarioSnap.headwinds]
  )

  const oppDelta = useMemo(
    () => listDelta(baselineSnap.opportunities, scenarioSnap.opportunities),
    [baselineSnap.opportunities, scenarioSnap.opportunities]
  )

  return (
    <div style={{ position: "absolute", left: 16, right: 16, bottom: 16, pointerEvents: "none", zIndex: 40 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          pointerEvents: "auto",
        }}
      >
        <Card title="Baseline" snap={baselineSnap} />
        <Card title={`Scenario (${scenarioSnap.scenarioId})`} snap={scenarioSnap} />

        <div
          style={{
            gridColumn: "1 / -1",
            background: "rgba(0,0,0,0.55)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 14,
            padding: 12,
            backdropFilter: "blur(10px)",
          }}
        >
          <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 6 }}>
            Deltas (Scenario vs Baseline)
          </div>

          <DeltaSection title="Primary drivers" delta={primaryDelta} />
          <DeltaSection title="Headwinds" delta={headwindsDelta} />
          <DeltaSection title="Opportunities" delta={oppDelta} />
        </div>
      </div>
    </div>
  )
}

function Card({ title, snap }: { title: string; snap: Snapshot }) {
  return (
    <div
      style={{
        background: "rgba(0,0,0,0.55)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 14,
        padding: 12,
        backdropFilter: "blur(10px)",
        minHeight: 140,
      }}
    >
      <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
        {snap.iterations?.toLocaleString?.() ?? "—"} paths · {snap.horizonMonths ?? "—"}mo
      </div>

      <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Summary</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {snap.summary.slice(0, 3).map((s, i) => (
          <li key={i} style={{ fontSize: 12 }}>
            {s}
          </li>
        ))}
      </ul>
    </div>
  )
}

function DeltaSection({
  title,
  delta,
}: {
  title: string
  delta: { added: string[]; removed: string[] }
}) {
  const { added, removed } = delta
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 12, opacity: 0.75 }}>{title}</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Added</div>
          {added.length === 0 ? (
            <div style={{ fontSize: 12, opacity: 0.6 }}>—</div>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {added.slice(0, 5).map((x, i) => (
                <li key={i} style={{ fontSize: 12 }}>
                  {x}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Removed</div>
          {removed.length === 0 ? (
            <div style={{ fontSize: 12, opacity: 0.6 }}>—</div>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {removed.slice(0, 5).map((x, i) => (
                <li key={i} style={{ fontSize: 12 }}>
                  {x}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
