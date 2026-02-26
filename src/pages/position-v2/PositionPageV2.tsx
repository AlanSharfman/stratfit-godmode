import React from "react";
import PositionScene from "./PositionScene";
import styles from "./PositionScene.module.css";

export default function PositionPageV2() {
  return (
    <div className={styles.pageRoot}>
      <div className={styles.bezelOuter}>
        <div className={styles.bezelInner}>
          {/* Micro step (optical recess) */}
          <div className={styles.innerStep} aria-hidden="true" />

          {/* Scene */}
          <div className={styles.sceneRoot}>
            <PositionScene />
          </div>

          {/* Glass stack (OLED + sub-pixel ripple) */}
          <div className={styles.glassSheen} aria-hidden="true" />
          <div className={styles.glassRipple} aria-hidden="true" />
        </div>

        {/* Bezel FX layers */}
        <div className={styles.bezelSpecularSweep} />
        <div className={styles.bezelChrome} />
        <div className={styles.bezelHighlights} />
        <div className={styles.bezelEdgeSpecular} />
        <div className={styles.bezelNoise} />
        <div className={styles.innerTrace} />
        <div className={styles.vignette} />
      </div>
    </div>
  );
}
