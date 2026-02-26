import React from "react"
import styles from "./PositionScene.module.css"

// Existing engine renderer (DO NOT MODIFY)
import TerrainStage from "@/terrain/TerrainStage"
import type { TimeGranularity } from "@/terrain/TimelineTicks"

type Props = {
  granularity?: TimeGranularity
  terrainMetrics?: any
  terrainSignals?: any
}

export default function PositionScene({
  granularity = "quarter",
  terrainMetrics,
  terrainSignals
}: Props) {
  return (
    <div className={styles.sceneRoot}>
      {/* Horizon Gradient */}
      <div className={styles.horizonGlow} aria-hidden="true" />

      {/* Terrain Container */}
      <div className={styles.terrainFrame}>
        <TerrainStage
          granularity={granularity}
          terrainMetrics={terrainMetrics}
          signals={terrainSignals}
          lockCamera
        />
      </div>

      {/* Atmospheric Fog */}
      <div className={styles.atmosFog} aria-hidden="true" />

      {/* Cinematic Vignette */}
      <div className={styles.vignette} aria-hidden="true" />
    </div>
  )
}
