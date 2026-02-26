import React, { useEffect } from "react";
import styles from "./PositionScene.module.css";
import TerrainStage from "@/terrain/TerrainStage";
import { useRenderFlagsStore } from "@/state/renderFlagsStore";
import CinematicLighting from "./rigs/CinematicLighting";
import HorizonAtmosphere from "./rigs/HorizonAtmosphere";
import SkyAtmosphere from "./rigs/SkyAtmosphere";

export default function PositionScene() {
  // Disable the cyan P50 path on this cinematic view
  useEffect(() => {
    useRenderFlagsStore.getState().set("showPaths", false);
    return () => { useRenderFlagsStore.getState().set("showPaths", true); };
  }, []);

  return (
    <div className={styles.canvasWrapper}>
      <div className={styles.stageMount}>
        <TerrainStage>
          <SkyAtmosphere />
          <HorizonAtmosphere />
          <CinematicLighting />
        </TerrainStage>
      </div>

      {/* Optional DOM glow overlay (kept) */}
      <div className={styles.horizonGlow} />
    </div>
  );
}
