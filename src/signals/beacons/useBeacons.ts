import { useMemo } from "react"
import { useScenarioStore } from "@/state/scenarioStore"
import { useCanonicalSimulationPrimitives } from "@/state/selectors/canonicalSimulationSelectors"
import { generateBeacons } from "./generateBeacons"

export function useBeacons() {
  const baseline = useScenarioStore((s) => s.baseline)

  const {
    survival,
    runway,
    volatility,
    confidence,
  } = useCanonicalSimulationPrimitives()

  return useMemo(() => {
    if (!baseline) return []

    // Scenario.simulation is SimulationSnapshot | null
    // Fields: survivalRate, medianRunway (NOT survival/runway)
    return generateBeacons({
      survival,
      survivalDelta: survival - (baseline.simulation?.survivalRate ?? 0),
      runwayMonths: runway,
      runwayDeltaMonths: runway - (baseline.simulation?.medianRunway ?? 0),
      volatility,
      confidence,
    })
  }, [baseline, survival, runway, volatility, confidence])
}
