// src/hooks/useCommandAutoEvaluate.ts
// ═══════════════════════════════════════════════════════════════════════════
// STRATFIT — Command Auto-Evaluate Hook (God Mode)
//
// Triggers commandStore.autoEvaluate whenever simulation results change.
// Used on Position, Studio, and Compare pages.
// ═══════════════════════════════════════════════════════════════════════════

import { useEffect } from "react"
import { useCommandStore } from "@/store/commandStore"
import type { SimulationResults } from "@/state/phase1ScenarioStore"

/**
 * Call from any page that owns engine results.
 * Will auto-evaluate mode unless user has manual override active.
 */
export function useCommandAutoEvaluate(results: SimulationResults | null | undefined): void {
  const autoEvaluate = useCommandStore((s) => s.autoEvaluate)
  const completedAt = results?.completedAt ?? null

  useEffect(() => {
    if (completedAt) {
      autoEvaluate(results ?? null)
    }
  }, [completedAt, autoEvaluate, results])
}
