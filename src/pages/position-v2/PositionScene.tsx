import React from "react";
import styles from "./PositionScene.module.css";
import TerrainStage from "@/terrain/TerrainStage";
import SkyAtmosphere from "./rigs/SkyAtmosphere";

export default function PositionScene() {
  return (
    <div className={styles.canvasWrapper}>
      <div className={styles.stageMount}>
        <TerrainStage lockCamera pathsEnabled={false}>
          <SkyAtmosphere />
        </TerrainStage>
      </div>

      {/* Aerial perspective (screen-space, safe) */}
      <div className={styles.aerialHaze} />
      <div className={styles.horizonBloom} />

      {/* Optional existing glow */}
      <div className={styles.horizonGlow} />
    </div>
  );
}
