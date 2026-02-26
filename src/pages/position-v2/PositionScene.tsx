import React, { useState, useCallback } from "react";
import styles from "./PositionScene.module.css";
import TerrainStageV2 from "@/terrain/v2/TerrainStageV2";

export default function PositionScene() {
  return (
    <div className={styles.canvasWrapper}>
      <div className={styles.stageMount}>
        <TerrainStageV2
          granularity="monthly"
          terrainMetrics={null}
          signals={null}
          lockCamera
        />
      </div>

      {/* Screen-space depth layers (safe) */}
      <div className={styles.aerialHaze} />
      <div className={styles.horizonBloom} />
      <div className={styles.horizonGlow} />
    </div>
  );
}
