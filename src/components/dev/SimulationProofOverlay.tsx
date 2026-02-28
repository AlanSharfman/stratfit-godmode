// src/components/dev/SimulationProofOverlay.tsx
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — DEV-only proof overlay for simulation pipeline traceability.
// Shows: runId, baselineSnapshotId, configHash, resultsHash, stressProbability.
// Updates ONLY when lastCompletedRunId changes. Never renders in production.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo, memo } from "react"
import type { Phase1Scenario } from "@/state/phase1ScenarioStore"
import { stableHash } from "@/contracts/simulationPipeline"
import { selectStressProbability } from "@/selectors/probabilitySelectors"

interface Props {
  scenario: Phase1Scenario | null
  baselineSnapshotId: string | null
}

const OVERLAY_STYLE: React.CSSProperties = {
  position: "absolute",
  top: 8,
  left: 8,
  zIndex: 9999,
  background: "rgba(0, 0, 0, 0.75)",
  color: "rgba(34, 211, 238, 0.9)",
  fontFamily: "JetBrains Mono, monospace",
  fontSize: 10,
  lineHeight: 1.5,
  padding: "6px 10px",
  borderRadius: 4,
  border: "1px solid rgba(34, 211, 238, 0.2)",
  pointerEvents: "none",
  maxWidth: 320,
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
}

const SimulationProofOverlay: React.FC<Props> = memo(({ scenario, baselineSnapshotId }) => {
  // Only render in DEV
  if (!import.meta.env.DEV) return null
  if (!scenario?.simulationResults?.completedAt) return null

  const sim = scenario.simulationResults

  const proof = useMemo(() => {
    const runId = String(sim.completedAt)
    const configHash = stableHash({
      decision: scenario.decision,
      id: scenario.id,
      identity: scenario.identity,
    })
    const resultsHash = stableHash(sim)
    const stress = selectStressProbability(sim.kpis)

    return { runId, configHash, resultsHash, stress }
  }, [sim.completedAt]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={OVERLAY_STYLE} aria-hidden="true" data-testid="sim-proof-overlay">
      {`runId: ${proof.runId}\n`}
      {`baseline: ${baselineSnapshotId ?? "—"}\n`}
      {`configHash: ${proof.configHash}\n`}
      {`resultsHash: ${proof.resultsHash}\n`}
      {`stressProb: ${(proof.stress * 100).toFixed(1)}%`}
    </div>
  )
})

SimulationProofOverlay.displayName = "SimulationProofOverlay"
export default SimulationProofOverlay
