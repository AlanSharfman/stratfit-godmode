import React from "react"
import styles from "../PositionOverlays.module.css"

export default function TerrainLegend() {
  return (
    <div className={styles.legendBox}>
      <div className={styles.legendTitle}>Legend</div>

      <div className={styles.legendItem}>
        <span className={styles.legendKey}>Elevation</span> — overall business strength / momentum.
      </div>

      <div className={styles.legendItem}>
        <span className={styles.legendKey}>Path</span> — projected trajectory (primary line).
      </div>

      <div className={styles.legendItem}>
        <span className={styles.legendKey}>Timeline</span> — time reference (secondary axis).
      </div>

      <div className={styles.legendItem}>
        <span className={styles.legendKey}>Markers</span> — inflection points anchored to terrain.
      </div>
    </div>
  )
}
