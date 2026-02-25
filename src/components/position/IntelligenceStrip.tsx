// src/components/position/IntelligenceStrip.tsx
import React, { useEffect, useState } from "react"
import styles from "./IntelligenceStrip.module.css"

const OBSERVATIONS = [
  "Liquidity compression detected in Q3 window",
  "Margin stability below institutional threshold",
  "Burn trajectory diverging from P50 baseline",
  "Runway confidence: 94% — 18 month horizon",
  "Capital efficiency improving — EBITDA slope positive",
]

export default function IntelligenceStrip() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % OBSERVATIONS.length)
        setVisible(true)
      }, 400)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={styles.strip}>
      <span className={styles.label}>SYS</span>
      <span className={`${styles.text} ${visible ? styles.visible : styles.hidden}`}>
        {OBSERVATIONS[index]}
      </span>
    </div>
  )
}
