import React, { useEffect, useState } from "react"
import styles from "./PositionScene.module.css"
import { useRenderFlagsStore } from "@/state/renderFlagsStore"
import { exportCanvasSnapshot } from "./exportCanvasSnapshot"

export default function PositionRightRail({
  getCanvasEl,
}: {
  getCanvasEl: () => HTMLCanvasElement | null
}) {
  const showMarkers = useRenderFlagsStore((s) => s.showMarkers)
  const showPaths = useRenderFlagsStore((s) => s.showPaths)
  const showFlow = useRenderFlagsStore((s) => s.showFlow)
  const showGrid = useRenderFlagsStore((s) => s.showGrid)
  const toggle = useRenderFlagsStore((s) => s.toggle)

  const [demoActive, setDemoActive] = useState(false)

  useEffect(() => {
    const onStart = () => setDemoActive(true)
    const onStop = () => setDemoActive(false)

    window.addEventListener("sf.demo.start", onStart)
    window.addEventListener("sf.demo.stop", onStop)
    return () => {
      window.removeEventListener("sf.demo.start", onStart)
      window.removeEventListener("sf.demo.stop", onStop)
    }
  }, [])

  const startDemoTour = () => {
    window.dispatchEvent(
      new CustomEvent("sf.demo.start", { detail: { route: "position" } })
    )
    window.dispatchEvent(
      new CustomEvent("sf.demo.spotlight", { detail: { on: true, label: "Baseline" } })
    )
    window.dispatchEvent(new CustomEvent("sf.demo.phase", { detail: { phase: "Position" } }))

    // REQUEST (guarded) — will fire once per tour
    window.dispatchEvent(
      new CustomEvent("sf.demo.narrate.request", { detail: { cue: "position.entry" } })
    )
  }

  const stopDemoTour = () => {
    window.dispatchEvent(
      new CustomEvent("sf.demo.narrate.request", { detail: { cue: "demo.stop" } })
    )
    window.dispatchEvent(new CustomEvent("sf.demo.spotlight", { detail: { on: false } }))
    window.dispatchEvent(new CustomEvent("sf.demo.stop", { detail: { route: "position" } }))
  }

  const exportSnapshot = () => {
    window.dispatchEvent(new CustomEvent("sf.export.snapshot", { detail: { route: "position" } }))
    exportCanvasSnapshot(getCanvasEl())
  }

  return (
    <aside className={styles.rightRail}>
      <div className={styles.railSection}>
        <div className={styles.railTitle}>Command</div>

        <Toggle label="Markers" checked={showMarkers} onChange={() => toggle("showMarkers")} />
        <Toggle label="Flow" checked={showFlow} onChange={() => toggle("showFlow")} />
        <Toggle label="Ticks" checked={showGrid} onChange={() => toggle("showGrid")} />

        {/* Paths control retained (requested OFF by default, but store flag exists) */}
        <Toggle label="Paths" checked={showPaths} onChange={() => toggle("showPaths")} />

        {!demoActive ? (
          <button className={styles.commandButton} onClick={startDemoTour}>
            Start Demo Tour
          </button>
        ) : (
          <button className={styles.commandButton} onClick={stopDemoTour}>
            Stop Demo Tour
          </button>
        )}

        <button className={styles.commandButton} onClick={exportSnapshot}>
          Export Snapshot
        </button>
      </div>
    </aside>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className={styles.toggleRow} onClick={onChange}>
      <span className={styles.metricLabel}>{label}</span>
      <div className={`${styles.toggle} ${checked ? styles.on : ""}`} />
    </div>
  )
}
