import React from "react";
import styles from "./PositionScene.module.css";
import TerrainStage from "@/terrain/TerrainStage";
import SkyAtmosphere from "./rigs/SkyAtmosphere";
import VolumetricHorizon from "./rigs/VolumetricHorizon";
import CameraCompositionRig from "./rigs/CameraCompositionRig";
import TerrainBreathRig from "./rigs/TerrainBreathRig";

export default function PositionScene() {
  return (
    <div className={styles.canvasWrapper}>
      <div className={styles.stageMount}>
        <TerrainStage lockCamera pathsEnabled={false}>
          {/* ✅ CAMERA COMPOSITION FINAL TUNE (one-shot, deterministic) */}
          <CameraCompositionRig />

          {/* Terrain breath — slow organic heave */}
          <TerrainBreathRig />

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
