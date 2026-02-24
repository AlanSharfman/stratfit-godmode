import { useMemo } from "react";
import { useSimulationSelectors } from "@/core/selectors/useSimulationSelectors";
import { useLavaIntensity } from "@/logic/lava/useLavaIntensity";
import { useScenarioStore } from "@/state/scenarioStore";
import { computeDivergence } from "@/logic/divergence/computeDivergence";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

/**
 * STRATFIT — Flowline Intensity (V1)
 *
 * Goal:
 * - Brighten the flowline when liquidity pressure/runway compression is the dominant problem.
 *
 * Inputs:
 * - Canonical runwayMonths (truth)
 * - Divergence runwayDeltaMonths (scenario vs baseline)
 *
 * Output:
 * - intensity01 0..1
 */
export function useFlowlineIntensity(scenarioId?: string) {
  const { runwayMonths } = useSimulationSelectors();
  const lava = useLavaIntensity(scenarioId);

  const baseline = useScenarioStore((s) => s.baseline);
  const savedScenarios = useScenarioStore((s) => s.savedScenarios);

  return useMemo(() => {
    // Canonical pressure: low runway => high intensity
    // 0..24 months mapped to 1..0
    const canonical = (() => {
      const r = typeof runwayMonths === "number" ? runwayMonths : null;
      if (r == null) return 0;
      // <6 months = max pressure; 24+ months = minimal pressure
      const x = (24 - Math.min(24, Math.max(0, r))) / 18; // 0..1-ish
      return clamp01(x);
    })();

    // Divergence pressure: negative runway delta => more intensity
    const divergence = (() => {
      if (!baseline?.simulation) return 0;

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

      if (!scenario?.simulation) return 0;

      const div = computeDivergence(baseline.simulation as any, scenario.simulation as any);
      // If runway decreased, intensity increases. Scale: -12 months => 1.0
      const dec = Math.max(0, -div.runwayDeltaMonths);
      return clamp01(dec / 12);
    })();

    // Lava runway component exists already; use as a minor stabilizer.
    const lavaRunway = lava?.runway ?? 0;

    // Final: canonical dominates, divergence boosts, lava stabilizes.
    return clamp01(canonical * 0.65 + divergence * 0.30 + lavaRunway * 0.15);
  }, [runwayMonths, lava, baseline, savedScenarios, scenarioId]);
}
