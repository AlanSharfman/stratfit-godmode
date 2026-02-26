import React from "react";
import styles from "./PositionScene.module.css";
import TerrainStage from "@/terrain/TerrainStage";

export default function PositionScene() {
  return (
    <div className={styles.canvasWrapper}>
      {/* TerrainStage owns the Canvas */}
      <div className={styles.stageMount}>
        <TerrainStage />
      </div>

      {/* Cinematic overlays (DOM/CSS only — safe) */}
      <div className={styles.vignette} />
      <div className={styles.atmosHaze} />
      <div className={styles.horizonGlow} />
      <div className={styles.topFade} />
    </div>
  );
}
