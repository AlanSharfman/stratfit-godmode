import React from "react";
import styles from "./PositionScene.module.css";
import TerrainStage from "@/terrain/TerrainStage";
import SkyAtmosphere from "./rigs/SkyAtmosphere";
import VolumetricHorizon from "./rigs/VolumetricHorizon";

export default function PositionScene() {
  return (
    <div className={styles.canvasWrapper}>
      <div className={styles.stageMount}>
        <TerrainStage lockCamera pathsEnabled={false}>
          <SkyAtmosphere />
          <VolumetricHorizon />
        </TerrainStage>
      </div>

      <div className={styles.aerialHaze} />
      <div className={styles.horizonBloom} />
      <div className={styles.horizonGlow} />
    </div>
  );
}
