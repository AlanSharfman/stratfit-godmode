import React from "react";
import styles from "./PositionScene.module.css";
import TerrainStage from "@/terrain/TerrainStage";

export default function PositionScene() {
  return (
    <div className={styles.canvasWrapper}>
      {/* TerrainStage owns its own R3F Canvas. Do NOT wrap it in another Canvas. */}
      <div className={styles.stageMount}>
        <TerrainStage />
      </div>

      {/* UI/FX overlays (must be above Canvas) */}
      <div className={styles.horizonGlow} />
    </div>
  );
}
