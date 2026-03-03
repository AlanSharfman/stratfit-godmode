import React, { useEffect, useMemo, useState } from "react"
import styles from "./PositionScene.module.css"
import { useRenderFlagsStore } from "@/state/renderFlagsStore"
import { exportCanvasSnapshot } from "./exportCanvasSnapshot"

type DemoStop = {
  label: string
  phase: string
  cue: string
  actions?: Array<() => void>
}

const DEMO_STEP_MS = 5200 // PASS R: tighter cadence (matches 5s hold + buffer)

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
  const set = useRenderFlagsStore((s) => s.set)

  const [demoActive, setDemoActive] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    const onStart = () => setDemoActive(true)
    const onStop = () => {
      setDemoActive(false)
      setIsRunning(false)
    }
    window.addEventListener("sf.demo.start", onStart)
    window.addEventListener("sf.demo.stop", onStop)
    return () => {
      window.removeEventListener("sf.demo.start", onStart)
      window.removeEventListener("sf.demo.stop", onStop)
    }
  }, [])

  const stops: DemoStop[] = useMemo(
    () => [
      {
        label: "Baseline",
        phase: "Position",
        cue: "position.baseline",
        actions: [
          () => set("showMarkers", true),
          () => set("showFlow", false),
          () => set("showGrid", false),
          () => set("showPaths", false),
        ],
      },
      { label: "Cash", phase: "Position", cue: "position.cash", actions: [() => set("showMarkers", true)] },
      { label: "Runway", phase: "Position", cue: "position.runway", actions: [() => set("showMarkers", true)] },
      { label: "Risk", phase: "Position", cue: "position.risk", actions: [() => set("showFlow", true)] },
      { label: "Paths ON", phase: "Position", cue: "position.paths_on", actions: [() => set("showPaths", true)] },
      { label: "End", phase: "Position", cue: "position.end" },
    ],
    [set]
  )

  const startDemoTour = () => {
    window.dispatchEvent(new CustomEvent("sf.demo.start", { detail: { route: "position" } }))
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

  const runSequence = async () => {
    setIsRunning(true)
    startDemoTour()

    const api = (window as any).SF_DEMO
    if (!api?.stopAt) {
      console.warn("[STRATFIT] SF_DEMO bridge missing. PASS (I) required.")
      setIsRunning(false)
      return
    }

    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

    for (const s of stops) {
      if (s.actions) s.actions.forEach((fn) => fn())
      api.stopAt({ label: s.label, phase: s.phase, cue: s.cue })
      await wait(DEMO_STEP_MS)
    }

    stopDemoTour()
    setIsRunning(false)
  }

  return (
    <aside className={styles.rightRail}>
      <div className={styles.railSection}>
        <div className={styles.railTitle}>Command</div>

        <Toggle label="Markers" checked={showMarkers} onChange={() => toggle("showMarkers")} />
        <Toggle label="Flow" checked={showFlow} onChange={() => toggle("showFlow")} />
        <Toggle label="Ticks" checked={showGrid} onChange={() => toggle("showGrid")} />
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

        <div className={styles.railDivider} />

        <button
          className={styles.commandButton}
          onClick={runSequence}
          disabled={isRunning}
          aria-disabled={isRunning}
        >
          {isRunning ? "Running Demo Sequence…" : "Run Demo Sequence"}
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