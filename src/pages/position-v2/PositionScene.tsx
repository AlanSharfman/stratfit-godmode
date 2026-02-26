import React, { useEffect } from "react";
import styles from "./PositionScene.module.css";
import TerrainStage from "@/terrain/TerrainStage";
import { useRenderFlagsStore } from "@/state/renderFlagsStore";

export default function PositionScene() {
  // Disable the cyan P50 path on this cinematic view
  useEffect(() => {
    useRenderFlagsStore.getState().set("showPaths", false);
    return () => { useRenderFlagsStore.getState().set("showPaths", true); };
  }, []);

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
