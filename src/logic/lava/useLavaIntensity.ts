import { useMemo } from "react";
import { useScenarioStore } from "@/state/scenarioStore";
import { computeDivergence } from "@/logic/divergence/computeDivergence";
import { mapDivergenceToLava, type LavaIntensity } from "./mapDivergenceToLava";

/**
 * STRATFIT — Lava Intensity Hook (Module 4)
 * Reads scenarioStore snapshots (baseline vs scenario) and returns lava intensity 0..1.
 *
 * Primitive selectors only; memoized; read-only.
 */
export function useLavaIntensity(scenarioId?: string): LavaIntensity | null {
  const baseline = useScenarioStore((s) => s.baseline);
  const savedScenarios = useScenarioStore((s) => s.savedScenarios);

  return useMemo(() => {
    if (!baseline?.simulation) return null;

    const scenario =
      scenarioId
        ? (savedScenarios ?? []).find((x) => x.id === scenarioId) ?? null
        : (() => {
            const withSim = (savedScenarios ?? []).filter((x) => !!x?.simulation);
            if (withSim.length === 0) return null;
            return withSim
              .slice()
              .sort((a, b) => {
                const ta = new Date(a.simulation!.simulatedAt).getTime();
                const tb = new Date(b.simulation!.simulatedAt).getTime();
                return tb - ta;
              })[0] ?? null;
          })();

    if (!scenario?.simulation) return null;

    const div = computeDivergence(baseline.simulation as any, scenario.simulation as any);

    // The mapper expects a subset; pass only what it needs.
    const lava = mapDivergenceToLava({
      survivalDeltaPp: div.survivalDeltaPp,
      runwayDeltaMonths: div.runwayDeltaMonths,
      arrDeltaP50: div.arrDeltaP50,
      cashDeltaP50: div.cashDeltaP50,
      arrSpreadDeltaPct: div.arrSpreadDeltaPct,
      runwaySpreadDeltaPct: div.runwaySpreadDeltaPct,
      scoreDelta: div.scoreDelta,
    });

    return lava;
  }, [baseline, savedScenarios, scenarioId]);
}
