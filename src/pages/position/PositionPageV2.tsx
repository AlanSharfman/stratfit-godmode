import React from "react"
import styles from "./PositionScene.module.css"
import PositionScene from "./PositionScene"

export default function PositionPageV2() {
  return (
    <div className={styles.pageRoot}>
      <div className={styles.skyGradient} />

      {/* Bezel-corner dock (top-left / top-right) */}
      <div className={styles.cornerDock}>
        <div className={styles.cornerTL}>
          <div className={styles.pillGroup}>
            <span className={styles.pillDot} />
            <span className={styles.pillText}>STRATFIT</span>
          </div>
          <div className={styles.pillGroupMuted}>
            <span className={styles.pillTextMuted}>POSITION</span>
          </div>
        </div>

        <div className={styles.cornerTR}>
          <div className={styles.pillGroupMuted}>
            <span className={styles.pillTextMuted}>LIVE</span>
          </div>
          <div className={styles.pillGroup}>
            <span className={styles.pillText}>V2</span>
          </div>
        </div>
      </div>

      <PositionScene />
    </div>
  )
}
