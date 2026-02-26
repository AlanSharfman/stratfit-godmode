import React from "react"
import styles from "./PositionPageV2.module.css"
import PositionScene from "./PositionScene"

export default function PositionPageV2() {
  return (
    <div className={styles.pageRoot}>
      {/* Cinematic Terrain */}
      <PositionScene />

      {/* UI Overlay Layer */}
      <div className={styles.overlayLayer}>
        <div className={styles.centerHint}>
          Position V2 — Cinematic Scene Initialized
        </div>
      </div>
    </div>
  )
}
