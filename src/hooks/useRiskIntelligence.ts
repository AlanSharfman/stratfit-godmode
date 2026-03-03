// src/hooks/useRiskIntelligence.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Phase 300: useRiskIntelligence Hook
//
// Single read point for Risk Intelligence in UI.
// Reads phase1ScenarioStore → runs riskIntelligenceEngine → returns output.
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo } from "react";
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore";
import { selectKpis } from "@/selectors/kpiSelectors";
import {
  computeRiskIntelligence,
  type RiskIntelligenceOutput,
} from "@/engine/riskIntelligenceEngine";

export interface UseRiskIntelligenceReturn {
  /** Full risk intelligence output, or null if insufficient data */
  intelligence: RiskIntelligenceOutput | null;
  /** Whether a simulation is complete and intelligence is available */
  ready: boolean;
}

export function useRiskIntelligence(): UseRiskIntelligenceReturn {
  const activeScenarioId = usePhase1ScenarioStore((s) => s.activeScenarioId);
  const scenarios = usePhase1ScenarioStore((s) => s.scenarios);

  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === activeScenarioId) ?? null,
    [scenarios, activeScenarioId],
  );

  const intelligence = useMemo(() => {
    if (!activeScenario?.simulationResults) return null;
    if (activeScenario.status !== "complete") return null;

    const simKpis = activeScenario.simulationResults.kpis;
    const selectedKpis = selectKpis(simKpis);

    const engineRunId = activeScenario.simulationResults.completedAt?.toString();

    return computeRiskIntelligence({
      simulationKpis: simKpis,
      selectedKpis,
      engineRunId,
      baselineKpis: selectedKpis, // Self-compare for now; future: wire baseline store
    });
  }, [activeScenario]);

  return {
    intelligence,
    ready: intelligence !== null,
  };
}
