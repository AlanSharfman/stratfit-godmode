import React, { useMemo, useState } from "react";
import ScenarioMountain from "@/components/mountain/ScenarioMountain";
import { TerrainWithFallback } from "@/components/terrain/TerrainFallback2D";
import StructuralMetricsPanel from "@/components/baseline/StructuralMetricsPanel";
import BaselineIntelligencePanel from "@/components/baseline/BaselineIntelligencePanel";
import BaselineKeyStrip from "@/components/baseline/BaselineKeyStrip";
import type { MetricId } from "@/types/baseline";
import {
  TerrainAnchorOverlay,
  BASELINE_METRIC_CONNECTIONS,
} from "@/components/mountain/anchorSystem";
import styles from "./BaselinePage.module.css";

export default function BaselinePage() {
  const [heatmapOn, setHeatmapOn] = useState(false);
  const [activeMetricId, setActiveMetricId] = useState<MetricId | null>(null);
  const [terrainMesh, setTerrainMesh] = useState<import("three").Mesh | null>(null);

  const connections = useMemo(() => BASELINE_METRIC_CONNECTIONS, []);

  return (
    <div className={styles.wrap}>
      <div className={styles.topbar}>
        <div className={styles.leftBrand}>
          <div className={styles.brand}>STRATFIT — BASELINE</div>
        </div>

        <div className={styles.centerTitle}>
          <div className={styles.title}>Deterministic Structural Baseline</div>
          <div className={styles.subtitle}>No intervention applied.</div>
        </div>

        <div className={styles.rightControls}>
          <div className={styles.meta}>10:24 AM&nbsp;&nbsp;|&nbsp;&nbsp;ACME CORP&nbsp;&nbsp;|&nbsp;&nbsp;USD</div>
          <button
            type="button"
            className={`${styles.toggle} ${heatmapOn ? styles.toggleOn : ""}`}
            onClick={() => setHeatmapOn((v) => !v)}
            aria-pressed={heatmapOn}
          >
            HEAT MAP: {heatmapOn ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      <div className={styles.main}>
        <div className={styles.leftPanel}>
          <StructuralMetricsPanel activeMetricId={activeMetricId} onHover={setActiveMetricId} />
        </div>

        <div className={`${styles.mountain} sf-mountain-backplate`}>
          <TerrainWithFallback>
            <ScenarioMountain
              scenario="base"
              mode="baseline"
              baselineAutoRotate
              baselineAutoRotatePaused={!!activeMetricId}
              baselineAllow360Rotate
              baselineHighVisibility
              transparentContainer
              transparentScene
              onTerrainMeshReady={setTerrainMesh}
              overlay={
                <TerrainAnchorOverlay
                  mode="baseline"
                  connections={connections}
                  activeFromId={activeMetricId}
                  terrainMesh={terrainMesh}
                  heatmapOn={heatmapOn}
                />
              }
            />
          </TerrainWithFallback>
        </div>

        <div className={styles.rightPanel}>
          <BaselineIntelligencePanel />
        </div>
      </div>

      <div className={styles.bottom}>
        <BaselineKeyStrip />
      </div>

      {/* NO TIMELINE here by design */}
    </div>
  );
}
