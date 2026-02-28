import React, { useMemo } from "react";
import styles from "./PositionScene.module.css";
import TerrainStageV2 from "@/terrain/v2/TerrainStageV2";
import { useSystemBaseline } from "@/system/SystemBaselineProvider";
import { deriveTerrainMetrics } from "@/terrain/terrainFromBaseline";

export default function PositionScene() {
  const { baseline } = useSystemBaseline();

  const terrainMetrics = useMemo(() => {
    if (!baseline?.financial) return null;
    const f = baseline.financial;
    return deriveTerrainMetrics({
      growthRate: f.growthRatePct,
      grossMargin: f.grossMarginPct,
      cash: f.cashOnHand,
      burnRate: f.monthlyBurn,
      revenue: f.arr / 12,
    });
  }, [baseline]);

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
