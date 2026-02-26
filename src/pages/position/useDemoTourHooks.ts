import { useEffect, useRef, useState } from "react"

type DemoSpotlightDetail = {
  on?: boolean
  label?: string
}

type DemoPhaseDetail = {
  phase?: string
}

type DemoNarrateDetail = {
  cue?: string
}

const HOLD_MS = 5000

export default function useDemoTourHooks() {
  const [spotlightOn, setSpotlightOn] = useState(false)
  const [spotlightLabel, setSpotlightLabel] = useState<string | null>(null)
  const [phase, setPhase] = useState<string | null>(null)
  const [tourActive, setTourActive] = useState(false)
  const [holdActive, setHoldActive] = useState(false)

  const holdTimerRef = useRef<number | null>(null)
  const narratedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const clearHoldTimer = () => {
      if (holdTimerRef.current != null) {
        window.clearTimeout(holdTimerRef.current)
        holdTimerRef.current = null
      }
    }

    const startHold = () => {
      setHoldActive(true)
      clearHoldTimer()
      holdTimerRef.current = window.setTimeout(() => {
        setHoldActive(false)
        setSpotlightOn(false)
        setSpotlightLabel(null)
        window.dispatchEvent(
          new CustomEvent("sf.demo.spotlight", { detail: { on: false } })
        )
      }, HOLD_MS)
    }

    const narrateOnce = (cue: string) => {
      if (!cue) return
      if (narratedRef.current.has(cue)) return
      narratedRef.current.add(cue)
      window.dispatchEvent(new CustomEvent("sf.demo.narrate", { detail: { cue } }))
    }

    const onStart = () => {
      setTourActive(true)
      setPhase("Position")
      narratedRef.current.clear()
      narrateOnce("position.entry")
    }

    const onStop = () => {
      setTourActive(false)
      setHoldActive(false)
      clearHoldTimer()
      setSpotlightOn(false)
      setSpotlightLabel(null)
      setPhase(null)
      narratedRef.current.clear()
    }

    const onSpotlight = (e: Event) => {
      const detail = (e as CustomEvent<DemoSpotlightDetail>).detail || {}
      const on = !!detail.on
      setSpotlightOn(on)
      setSpotlightLabel(on ? detail.label ?? "Focus" : null)

      if (on) {
        startHold()
        narrateOnce(`spotlight.${(detail.label ?? "focus").toLowerCase()}`)
      } else {
        setHoldActive(false)
        clearHoldTimer()
      }
    }

    const onPhase = (e: Event) => {
      const detail = (e as CustomEvent<DemoPhaseDetail>).detail || {}
      const next = detail.phase ?? null
      setPhase(next)
      if (next) narrateOnce(`phase.${next.toLowerCase()}`)
    }

    // Guard narration requests: only allow each cue once per tour
    const onNarrateRequest = (e: Event) => {
      const detail = (e as CustomEvent<DemoNarrateDetail>).detail || {}
      const cue = detail.cue ?? ""
      narrateOnce(cue)
    }

    window.addEventListener("sf.demo.start", onStart)
    window.addEventListener("sf.demo.stop", onStop)
    window.addEventListener("sf.demo.spotlight", onSpotlight as EventListener)
    window.addEventListener("sf.demo.phase", onPhase as EventListener)
    window.addEventListener("sf.demo.narrate.request", onNarrateRequest as EventListener)

    return () => {
      window.removeEventListener("sf.demo.start", onStart)
      window.removeEventListener("sf.demo.stop", onStop)
      window.removeEventListener("sf.demo.spotlight", onSpotlight as EventListener)
      window.removeEventListener("sf.demo.phase", onPhase as EventListener)
      window.removeEventListener(
        "sf.demo.narrate.request",
        onNarrateRequest as EventListener
      )
      clearHoldTimer()
    }
  }, [])

  return {
    tourActive,
    phase,
    spotlightOn,
    spotlightLabel,
    holdActive,
  }
}
