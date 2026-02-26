import React, { Suspense } from "react";
import styles from "./PositionScene.module.css";
import TerrainStage from "@/terrain/TerrainStage";
import CinematicLighting from "./rigs/CinematicLighting";
import HorizonAtmosphere from "./rigs/HorizonAtmosphere";

export default function PositionScene() {
  return (
    <div className={styles.canvasWrapper}>
      {/* TerrainStage owns the Canvas */}
      <div className={styles.stageMount}>
        <TerrainStage />

        {/* Inject cinematic rigs INSIDE stage mount overlay layer */}
        <div className={styles.rigLayer}>
          <CinematicLighting />
          <HorizonAtmosphere />
        </div>
      </div>

      {/* UI FX overlay */}
      <div className={styles.horizonGlow} />
    </div>
  );
}
