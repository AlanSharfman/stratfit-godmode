// src/hooks/useStaleGuard.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Stale Render Guard
//
// Prevents UI from rendering stale simulation data when:
//   1. Scenario changed but sim hasn't re-run yet
//   2. Simulation is currently running (status === "running")
//   3. No simulation has ever completed
//
// Returns { isStale, isRunning, hasResults } — UI components can use
// these to show stale indicators or blur content.
//
// ARCHITECTURE: Pure read hook. No mutations. Additive guard layer.
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo } from "react";
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore";

export interface StaleGuardResult {
  /** True when current data may not reflect the active scenario */
  isStale: boolean;
  /** True when a simulation is currently running */
  isRunning: boolean;
  /** True when at least one completed simulation exists */
  hasResults: boolean;
  /** Active scenario's simulation status */
  status: string | null;
}

/**
 * Hook: stale render guard.
 *
 * Usage:
 *   const { isStale, isRunning } = useStaleGuard();
 *   if (isStale) return <StaleOverlay />;
 */
export function useStaleGuard(): StaleGuardResult {
  const activeScenarioId = usePhase1ScenarioStore((s) => s.activeScenarioId);
  const scenarios = usePhase1ScenarioStore((s) => s.scenarios);
  const lastCompletedRunId = usePhase1ScenarioStore((s) => s.lastCompletedRunId);

  return useMemo(() => {
    // No scenario selected
    if (!activeScenarioId) {
      return {
        isStale: false,
        isRunning: false,
        hasResults: lastCompletedRunId != null,
        status: null,
      };
    }

    const scenario = scenarios.find((s) => s.id === activeScenarioId);
    if (!scenario) {
      return {
        isStale: true,
        isRunning: false,
        hasResults: lastCompletedRunId != null,
        status: null,
      };
    }

    const status = scenario.status;
    const isRunning = status === "running";
    const isComplete = status === "complete";
    const hasResults = isComplete && !!scenario.simulationResults?.completedAt;

    // Stale if scenario exists but hasn't completed, or completedAt is sentinel (0)
    const isStale =
      !isComplete ||
      !scenario.simulationResults?.completedAt ||
      scenario.simulationResults.completedAt === 0;

    return {
      isStale: isStale && !isRunning, // Don't flag stale while actively running
      isRunning,
      hasResults,
      status,
    };
  }, [activeScenarioId, scenarios, lastCompletedRunId]);
}
