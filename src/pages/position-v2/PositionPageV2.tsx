import React from "react";
import PositionScene from "./PositionScene";
import styles from "./PositionScene.module.css";

export default function PositionPageV2() {
  return (
    <div className={styles.pageRoot}>
      {/* Titanium bezel shell */}
      <div className={styles.bezelOuter}>
        {/* Corner fasteners (jewelled hardware) */}
        <div className={styles.fasteners} aria-hidden="true">
          <span className={`${styles.fastener} ${styles.tl}`} />
          <span className={`${styles.fastener} ${styles.tr}`} />
          <span className={`${styles.fastener} ${styles.bl}`} />
          <span className={`${styles.fastener} ${styles.br}`} />
        </div>

        <div className={styles.bezelInner}>
          <div className={styles.sceneRoot}>
            <PositionScene />
          </div>
        </div>

        {/* Bezel FX layers (pure DOM/CSS) */}
        <div className={styles.bezelSpecularSweep} />
        <div className={styles.bezelChrome} />
        <div className={styles.bezelHighlights} />
        <div className={styles.bezelNoise} />
        <div className={styles.innerTrace} />
        <div className={styles.vignette} />
      </div>
    </div>
  );
}
