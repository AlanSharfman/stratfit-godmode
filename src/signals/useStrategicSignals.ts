import { useMemo } from "react";
import { useScenarioStore } from "@/state/scenarioStore";
import { useSimulationSelectors } from "@/core/selectors/useSimulationSelectors";
import { generateStrategicSignals, type SignalInputs } from "./generateStrategicSignals";

/**
 * IMPORTANT:
 * - Primitive selectors only
 * - Read-only
 * - No effects
 *
 * useSimulationSelectors returns a plain object (not a selector-style hook).
 * Fields: survivalProbability, confidenceIndex, volatility, runwayMonths, baseValue.
 *
 * Baseline deltas are derived from scenarioStore.baseline.simulation where available.
 * SimulationSnapshot fields: survivalRate, medianRunway.
 * No direct valuation field in SimulationSnapshot — valuationDelta defaults to 0.
 */
export function useStrategicSignals() {
  const baseline = useScenarioStore((s) => s.baseline);

  // canonical primitives — useSimulationSelectors is a plain object hook
  const {
    survivalProbability,
    runwayMonths,
    baseValue,
    volatility,
    confidenceIndex,
  } = useSimulationSelectors();

  const signals = useMemo(() => {
    const inputs: SignalInputs = {
      survival: survivalProbability,
      runwayMonths,
      valuation: baseValue,
      volatility,
      confidence: confidenceIndex,

      // baseline deltas — fall back to 0 when no baseline simulation exists
      survivalDelta: survivalProbability - (baseline?.simulation?.survivalRate ?? 0),
      runwayDeltaMonths: runwayMonths - (baseline?.simulation?.medianRunway ?? 0),
      // SimulationSnapshot has no direct valuation — delta is 0 until enriched
      valuationDelta: 0,

      volatilityDelta: 0,
      confidenceDelta: 0,
    };

    return generateStrategicSignals(inputs);
  }, [
    baseline,
    survivalProbability,
    runwayMonths,
    baseValue,
    volatility,
    confidenceIndex,
  ]);

  return signals;
}
