import React from "react";
import PositionScene from "./PositionScene";
import styles from "./PositionScene.module.css";

export default function PositionPageV2() {
  return (
    <div className={styles.pageRoot}>
      <div className={styles.bezelOuter}>
        {/* Corner fasteners */}
        <div className={styles.fasteners} aria-hidden="true">
          <span className={`${styles.fastener} ${styles.tl}`} />
          <span className={`${styles.fastener} ${styles.tr}`} />
          <span className={`${styles.fastener} ${styles.bl}`} />
          <span className={`${styles.fastener} ${styles.br}`} />
        </div>

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

        {/* UI rails */}
        <div className={styles.uiTopRail} aria-hidden="true">
          <div className={styles.uiTopLeft}>
            <div className={styles.brandGlyph} />
            <div className={styles.brandText}>STRATFIT</div>
            <div className={styles.brandSep} />
            <div className={styles.modeText}>POSITION</div>
          </div>
          <div className={styles.uiTopRight}>
            <div className={styles.microPill}>LIVE</div>
            <div className={styles.microPillAlt}>V2</div>
          </div>
        </div>

        <div className={styles.uiLeftRail} aria-hidden="true">
          <div className={styles.railTitle}>BASELINE</div>
          <div className={styles.railSub}>Reality Surface</div>
          <div className={styles.railDivider} />
          <div className={styles.railHint}>Diagnostics attach here</div>
        </div>

        <div className={styles.uiRightRail} aria-hidden="true">
          <div className={styles.railTitle}>COMMAND</div>
          <div className={styles.railSub}>Director</div>
          <div className={styles.railDivider} />
          <div className={styles.railHint}>Tour / overlays / export</div>
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
