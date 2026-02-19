import React from "react"
import type { TimeGranularity } from "@/position/TimelineTicks"
import styles from "../PositionOverlays.module.css"

const GRANULARITY_OPTIONS: { value: TimeGranularity; label: string }[] = [
  { value: "month", label: "Mo" },
  { value: "quarter", label: "Qtr" },
  { value: "year", label: "Yr" },
]

export default function TimeScaleControl({
  granularity,
  setGranularity,
}: {
  granularity: TimeGranularity
  setGranularity: (g: TimeGranularity) => void
}) {
  return (
    <div className={styles.timeControl}>
      <span className={styles.timeLabel}>Time Scale</span>
      <div className={styles.timeDivider} />
      {GRANULARITY_OPTIONS.map((opt) => {
        const active = granularity === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setGranularity(opt.value)}
            className={`${styles.timeButton} ${active ? styles.timeButtonActive : ""}`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
