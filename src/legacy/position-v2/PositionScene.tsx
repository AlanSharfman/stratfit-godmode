import React, { useMemo } from "react";
import styles from "./PositionScene.module.css";
import TerrainStageV2 from "@/terrain/v2/TerrainStageV2";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import { usePhase1ScenarioStore } from "@/state/phase1ScenarioStore";
import { useShallow } from "zustand/react/shallow";
import { deriveTerrainMetrics } from "@/terrain/terrainFromBaseline";
import type { TerrainMetrics } from "@/terrain/terrainFromBaseline";

export default function PositionScene() {
  const { baseline } = useSystemBaseline();

  // Prefer engine-computed terrain metrics from active scenario
  const scenarioTerrainMetrics = usePhase1ScenarioStore(
    useShallow((s) => {
      const active = s.scenarios.find((sc) => sc.id === s.activeScenarioId);
      if (
        (active?.status === "running" || active?.status === "complete") &&
        active.simulationResults?.terrainMetrics
      ) {
        return active.simulationResults.terrainMetrics;
      }
      return null;
    }),
  );

  const terrainMetrics: TerrainMetrics | null = useMemo(() => {
    // PRIORITY 1: Engine metrics from active scenario
    if (scenarioTerrainMetrics) {
      return {
        elevationScale: scenarioTerrainMetrics.elevationScale,
        roughness: scenarioTerrainMetrics.roughness,
        ridgeIntensity: scenarioTerrainMetrics.ridgeIntensity,
        volatility: scenarioTerrainMetrics.volatility,
        // Legacy fields derived from baseline financial data
        liquidityDepth: baseline?.financial
          ? Math.min(
              (baseline.financial.cashOnHand / (baseline.financial.monthlyBurn || 1)) / 12,
              2,
            )
          : 1,
        growthSlope: baseline?.financial
          ? (Math.abs(baseline.financial.growthRatePct) <= 1
              ? baseline.financial.growthRatePct
              : baseline.financial.growthRatePct / 100)
          : 0,
      };
    }

    // PRIORITY 2: Derive from baseline (no scenario)
    if (!baseline?.financial) return null;
    const f = baseline.financial;
    return deriveTerrainMetrics({
      growthRate: f.growthRatePct,
      grossMargin: f.grossMarginPct,
      cash: f.cashOnHand,
      burnRate: f.monthlyBurn,
      revenue: f.arr / 12,
    });
  }, [scenarioTerrainMetrics, baseline]);

  return (
    <div className={styles.canvasWrapper}>
      <div className={styles.stageMount}>
        <TerrainStageV2
          granularity="monthly"
          terrainMetrics={terrainMetrics}
          signals={null}
          lockCamera
        />
      </div>

      {/* Screen-space depth layers (safe) */}
      <div className={styles.vignette} />
      <div className={styles.aerialHaze} />
      <div className={styles.horizonBloom} />
      <div className={styles.horizonGlow} />
    </div>
  );
}
