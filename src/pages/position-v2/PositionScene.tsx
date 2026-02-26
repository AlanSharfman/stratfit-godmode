import React from "react";
import styles from "./PositionScene.module.css";
import TerrainStage from "@/terrain/TerrainStage";
import SkyAtmosphere from "./rigs/SkyAtmosphere";
import VolumetricHorizon from "./rigs/VolumetricHorizon";
import CameraCompositionRig from "./rigs/CameraCompositionRig";

export default function PositionScene() {
  return (
    <div className={styles.canvasWrapper}>
      <div className={styles.stageMount}>
        <TerrainStage lockCamera pathsEnabled={false}>
          {/* ✅ CAMERA COMPOSITION FINAL TUNE (one-shot, deterministic) */}
          <CameraCompositionRig />

          {/* Atmosphere stack */}
          <SkyAtmosphere />
          <VolumetricHorizon />
        </TerrainStage>
      </div>

      {/* Screen-space depth layers (safe) */}
      <div className={styles.aerialHaze} />
      <div className={styles.horizonBloom} />
      <div className={styles.horizonGlow} />
    </div>
  );
}
