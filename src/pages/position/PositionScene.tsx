import React, { useRef } from "react"
import styles from "./PositionScene.module.css"
import { Canvas } from "@react-three/fiber"
import TerrainStage from "@/terrain/TerrainStage"
import PositionLeftRail from "./PositionLeftRail"
import PositionRightRail from "./PositionRightRail"
import useRenderWatchdog from "./useRenderWatchdog"
import useOverlayPersistence from "./useOverlayPersistence"
import useDemoTourHooks from "./useDemoTourHooks"
import useDemoScriptBridge from "./useDemoScriptBridge"

export default function PositionScene() {
  useRenderWatchdog()
  useOverlayPersistence()
  useDemoScriptBridge()

  const { tourActive, phase, spotlightOn, spotlightLabel, holdActive } =
    useDemoTourHooks()

  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  return (
    <div className={styles.sceneRoot}>
      <PositionLeftRail />

      <div className={styles.canvasWrap}>
        <Canvas
          gl={{ preserveDrawingBuffer: true }}
          onCreated={({ gl }) => {
            canvasRef.current = gl.domElement
          }}
        >
          <TerrainStage />
        </Canvas>

        <div className={styles.canvasVignette} />

        {tourActive && (
          <div className={styles.demoPill}>
            <span className={styles.demoPillDot} />
            <span className={styles.demoPillText}>{phase ?? "Demo"}</span>
            {holdActive && <span className={styles.demoHold}>HOLD</span>}
          </div>
        )}

        <div className={`${styles.spotlight} ${spotlightOn ? styles.spotlightOn : ""}`}>
          {spotlightOn && spotlightLabel && (
            <div className={styles.spotlightLabel}>{spotlightLabel}</div>
          )}
        </div>
      </div>

      <PositionRightRail getCanvasEl={() => canvasRef.current} />
    </div>
  )
}
