/**
 * STRATFIT — Canonical Simulation Selector Contract
 *
 * This file is the ONLY place where UI layers map to simulation store fields.
 * If store names ever change, update here — UI remains stable.
 *
 * Source: useSimulationSelectors() from @/core/selectors/useSimulationSelectors
 * which reads from CanonicalOutputStore. Returns a plain object — NOT a
 * selector-style hook.
 */

import { useSimulationSelectors } from "@/core/selectors/useSimulationSelectors";

/**
 * Canonical primitives consumed by:
 * - Strategic Signals
 * - Diff Inspector
 * - Lava adapter
 * - Executive export
 *
 * Field mapping (canonical name → store field):
 *   survival   ← survivalProbability  (output.simulation.survivalProbability)
 *   runway     ← runwayMonths         (output.liquidity.runwayMonths)
 *   valuation  ← baseValue            (output.valuation.baseValue)
 *   volatility ← volatility           (output.simulation.volatility)
 *   confidence ← confidenceIndex      (output.simulation.confidenceIndex)
 */
export function useCanonicalSimulationPrimitives() {
  const sels = useSimulationSelectors();

  return {
    survival: sels.survivalProbability,
    runway: sels.runwayMonths,
    valuation: sels.baseValue,
    volatility: sels.volatility,
    confidence: sels.confidenceIndex,
    // Deltas not available from CanonicalOutputStore — consumers must derive from baseline
    volatilityDelta: 0,
    confidenceDelta: 0,
  };
}
