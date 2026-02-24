import { useMemo } from "react";
import { useScenarioStore } from "@/state/scenarioStore";
import { useCanonicalSimulationPrimitives } from "@/state/selectors/canonicalSimulationSelectors";
import { generateStrategicSignals, type SignalInputs } from "./generateStrategicSignals";

/**
 * Canonical read-only signal selector.
 * Uses canonical selector layer (useCanonicalSimulationPrimitives) instead of
 * direct store access — field renames only need updating in one place.
 *
 * Baseline deltas: scenarioStore.baseline.simulation (SimulationSnapshot).
 *   survivalRate, medianRunway — no valuation field (valuationDelta = 0).
 *
 * No effects. No store writes.
 */
export function useStrategicSignals() {
  const baseline = useScenarioStore((s) => s.baseline);

  const {
    survival,
    runway,
    valuation,
    volatility,
    confidence,
    volatilityDelta,
    confidenceDelta,
  } = useCanonicalSimulationPrimitives();

  const signals = useMemo(() => {
    const inputs: SignalInputs = {
      survival,
      runwayMonths: runway,
      valuation,
      volatility,
      confidence,

      // baseline deltas — fall back to 0 when no baseline simulation exists
      survivalDelta: survival - (baseline?.simulation?.survivalRate ?? 0),
      runwayDeltaMonths: runway - (baseline?.simulation?.medianRunway ?? 0),
      // SimulationSnapshot has no direct valuation — delta is 0 until enriched
      valuationDelta: 0,

      volatilityDelta,
      confidenceDelta,
    };

    return generateStrategicSignals(inputs);
  }, [
    baseline,
    survival,
    runway,
    valuation,
    volatility,
    confidence,
    volatilityDelta,
    confidenceDelta,
  ]);

  return signals;
}
