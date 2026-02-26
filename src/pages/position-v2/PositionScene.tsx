import React from "react";
import styles from "./PositionScene.module.css";
import TerrainStage from "@/terrain/TerrainStage";
import SkyAtmosphere from "./rigs/SkyAtmosphere";

export default function PositionScene() {
  return (
    <div className={styles.canvasWrapper}>
      <div className={styles.stageMount}>
        <TerrainStage lockCamera>
          {/* SAFE SKY: in-canvas, no fog mutation, no camera authority */}
          <SkyAtmosphere />
        </TerrainStage>
      </div>

      {/* Optional DOM glow overlay */}
      <div className={styles.horizonGlow} />
    </div>
  );
}
