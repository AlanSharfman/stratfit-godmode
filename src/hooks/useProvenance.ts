// src/hooks/useProvenance.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — useProvenance Hook
//
// Aggregates provenance metadata from existing stores into a single
// ProvenanceSnapshot. Pure read — no mutations.
//
// Sources:
//   1. simulationEngineStore → runId, completedAt
//   2. phase1ScenarioStore → seed (from active scenario terrain data),
//      lastCompletedRunId
//   3. ENGINE_VERSION constant
//   4. inputsHash — computed from active scenario levers
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo } from "react";
import { useSimulationEngineStore } from "@/state/simulationEngineStore";
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore";
import {
  ENGINE_VERSION,
  computeInputsHash,
  EMPTY_PROVENANCE,
  type ProvenanceSnapshot,
} from "@/engine/provenanceContract";

/**
 * Returns a ProvenanceSnapshot derived from live store state.
 * Safe to call from any page — returns EMPTY_PROVENANCE when no run exists.
 */
export function useProvenance(): ProvenanceSnapshot {
  const engineRunId = useSimulationEngineStore((s) => s.runId);
  const completedAt = useSimulationEngineStore((s) => s.completedAt);
  const lastCompletedRunId = usePhase1ScenarioStore((s) => s.lastCompletedRunId);
  const activeScenarioId = usePhase1ScenarioStore((s) => s.activeScenarioId);
  const scenarios = usePhase1ScenarioStore((s) => s.scenarios);

  return useMemo(() => {
    // Prefer simulationEngineStore runId; fall back to phase1 lastCompletedRunId
    const runId = engineRunId ?? lastCompletedRunId;
    if (runId == null) return EMPTY_PROVENANCE;

    // Find active scenario for seed + inputsHash
    const activeScenario = activeScenarioId
      ? scenarios.find((s) => s.id === activeScenarioId)
      : null;

    const seed = activeScenario?.simulationResults?.terrain?.seed ?? null;

    // Compute deterministic hash from lever values (if present)
    const inputsHash = activeScenario?.leverValues
      ? computeInputsHash(activeScenario.leverValues as Record<string, unknown>)
      : null;

    return {
      runId,
      engineVersion: ENGINE_VERSION,
      seed,
      inputsHash,
      completedAt: completedAt ?? null,
    };
  }, [engineRunId, completedAt, lastCompletedRunId, activeScenarioId, scenarios]);
}
