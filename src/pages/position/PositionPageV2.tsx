import React from "react"
import styles from "./PositionScene.module.css"
import PositionScene from "./PositionScene"

export default function PositionPageV2() {
  return (
    <div className={styles.pageRoot}>
      <div className={styles.skyGradient} />
      <PositionScene />
    </div>
  )
}
