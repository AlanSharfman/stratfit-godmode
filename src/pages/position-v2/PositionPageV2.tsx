import React from "react";
import PositionScene from "./PositionScene";
import styles from "./PositionScene.module.css";

export default function PositionPageV2() {
  return (
    <div className={styles.pageRoot}>
      {/* Titanium bezel shell */}
      <div className={styles.bezelOuter}>
        <div className={styles.bezelInner}>
          <div className={styles.sceneRoot}>
            <PositionScene />
          </div>
        </div>

        {/* Bezel FX layers (pure DOM/CSS) */}
        <div className={styles.bezelChrome} />
        <div className={styles.bezelHighlights} />
        <div className={styles.bezelNoise} />
      </div>
    </div>
  );
}
