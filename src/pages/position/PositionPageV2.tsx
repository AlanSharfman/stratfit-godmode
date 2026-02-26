import React from "react"
import styles from "./PositionScene.module.css"
import PositionScene from "./PositionScene"

export default function PositionPageV2() {
  return (
    <div className={styles.pageRoot}>
      <div className={styles.skyGradient} />

      {/* GOD MODE bezel shell — jewelled frame wrapping entire compound */}
      <div className={styles.bezelOuter}>
        <div className={styles.bezelInner}>
          <PositionScene />

          {/* Glass overlay layers (pointer-events: none) */}
          <div className={styles.innerStep} />
          <div className={styles.glassSheen} />
          <div className={styles.glassRipple} />
        </div>

        {/* Bezel jewel / chrome / glow layers */}
        <div className={styles.bezelSpecularSweep} />
        <div className={styles.bezelChrome} />
        <div className={styles.bezelHighlights} />
        <div className={styles.bezelEdgeSpecular} />
        <div className={styles.innerTrace} />
        <div className={styles.vignette} />
      </div>
    </div>
  )
}
