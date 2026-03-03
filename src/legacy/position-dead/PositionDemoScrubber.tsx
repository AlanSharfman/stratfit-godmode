import React, { useMemo, useState } from "react"
import styles from "./PositionScene.module.css"
import { useRenderFlagsStore } from "@/state/renderFlagsStore"

type StopId = "baseline" | "cash" | "runway" | "risk" | "paths" | "end"

type DemoStop = {
  id: StopId
  label: string
  cue: string
  actions?: Array<() => void>
}

export default function PositionDemoScrubber() {
  const set = useRenderFlagsStore((s) => s.set)

  const [running, setRunning] = useState(false)

  const stops: DemoStop[] = useMemo(
    () => [
      {
        id: "baseline",
        label: "Baseline",
        cue: "position.baseline",
        actions: [
          () => set("showMarkers", true),
          () => set("showFlow", false),
          () => set("showGrid", false),
          () => set("showPaths", false),
        ],
      },
      { id: "cash", label: "Cash", cue: "position.cash", actions: [() => set("showMarkers", true)] },
      { id: "runway", label: "Runway", cue: "position.runway", actions: [() => set("showMarkers", true)] },
      { id: "risk", label: "Risk", cue: "position.risk", actions: [() => set("showFlow", true)] },
      { id: "paths", label: "Paths", cue: "position.paths_on", actions: [() => set("showPaths", true)] },
      { id: "end", label: "End", cue: "position.end" },
    ],
    [set]
  )

  const api = () => (window as any).SF_DEMO

  const ensureApi = () => {
    const a = api()
    if (!a?.stopAt || !a?.start || !a?.stop) {
      console.warn("[STRATFIT] SF_DEMO bridge missing. PASS (I) required.")
      return null
    }
    return a
  }

  const start = () => {
    const a = ensureApi()
    if (!a) return
    setRunning(true)
    a.start()
  }

  const stop = () => {
    const a = ensureApi()
    if (!a) return
    setRunning(false)
    a.stop()
  }

  const go = (s: DemoStop) => {
    const a = ensureApi()
    if (!a) return
    if (!running) {
      setRunning(true)
      a.start()
    }
    if (s.actions) s.actions.forEach((fn) => fn())
    a.stopAt({ label: s.label, phase: "Position", cue: s.cue })
  }

  const playAll = async () => {
    const a = ensureApi()
    if (!a) return
    setRunning(true)
    a.start()

    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

    for (const s of stops) {
      if (s.actions) s.actions.forEach((fn) => fn())
      a.stopAt({ label: s.label, phase: "Position", cue: s.cue })
      await wait(5400)
    }

    setRunning(false)
    a.stop()
  }

  return (
    <div className={styles.scrubberWrap} role="navigation" aria-label="Demo Scrubber">
      <div className={styles.scrubberLeft}>
        <button className={styles.scrubberBtn} onClick={running ? stop : start}>
          {running ? "Stop" : "Start"}
        </button>
        <button className={styles.scrubberBtn} onClick={playAll}>
          Play All
        </button>
      </div>

      <div className={styles.scrubberStops}>
        {stops.map((s) => (
          <button
            key={s.id}
            className={styles.scrubberStop}
            onClick={() => go(s)}
            title={s.label}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className={styles.scrubberRight}>
        <span className={styles.scrubberTag}>POSITION</span>
      </div>
    </div>
  )
}
