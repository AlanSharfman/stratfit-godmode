import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react"
import detectGraphicsCapabilities, {
  type GraphicsCapabilities,
  type RenderProfile,
} from "@/runtime/graphics/detectGraphicsCapabilities"

export interface GraphicsCapabilityContextValue {
  renderProfile: RenderProfile
  setRenderProfile: (profile: RenderProfile) => void
  webglSupported: boolean
  contextLossCount: number
}

export const GraphicsCapabilityContext = createContext<GraphicsCapabilityContextValue | null>(null)

const FPS_WARMUP_MS = 2000
const REDUCED_3D_THRESHOLD_FPS = 25

function clampProfileForSession(
  requested: RenderProfile,
  sessionFloor: RenderProfile,
): RenderProfile {
  if (sessionFloor === "fallback2d") return "fallback2d"
  if (sessionFloor === "reduced3d" && requested === "full3d") return "reduced3d"
  return requested
}

function getNextSessionFloor(currentFloor: RenderProfile, next: RenderProfile): RenderProfile {
  if (currentFloor === "fallback2d" || next === "fallback2d") return "fallback2d"
  if (currentFloor === "reduced3d" || next === "reduced3d") return "reduced3d"
  return "full3d"
}

export function GraphicsCapabilityProvider({ children }: { children: React.ReactNode }) {
  const detectedRef = useRef<GraphicsCapabilities | null>(null)
  if (detectedRef.current === null) {
    detectedRef.current = detectGraphicsCapabilities()
  }

  const detected = detectedRef.current
  const [renderProfileState, setRenderProfileState] = useState<RenderProfile>(() =>
    detected.webglSupported ? "full3d" : "fallback2d",
  )
  const [contextLossCount, setContextLossCount] = useState(0)

  const sessionFloorRef = useRef<RenderProfile>(detected.webglSupported ? "full3d" : "fallback2d")
  const warmupStartedRef = useRef(false)

  const setRenderProfile = useCallback((requested: RenderProfile) => {
    const next = clampProfileForSession(requested, sessionFloorRef.current)
    sessionFloorRef.current = getNextSessionFloor(sessionFloorRef.current, next)
    setRenderProfileState(next)
  }, [])

  useEffect(() => {
    if (!detected.webglSupported) {
      sessionFloorRef.current = "fallback2d"
      setRenderProfileState("fallback2d")
    }
  }, [detected.webglSupported])

  useEffect(() => {
    if (typeof document === "undefined" || !detected.webglSupported || warmupStartedRef.current) return

    let frameId = 0
    let observer: MutationObserver | null = null

    const runWarmupSample = () => {
      if (warmupStartedRef.current) return
      warmupStartedRef.current = true
      observer?.disconnect()

      let frames = 0
      const start = performance.now()

      const sample = (now: number) => {
        frames += 1
        const elapsed = now - start
        if (elapsed >= FPS_WARMUP_MS) {
          const avgFps = frames / (elapsed / 1000)
          if (avgFps < REDUCED_3D_THRESHOLD_FPS) {
            setRenderProfile("reduced3d")
          }
          return
        }
        frameId = window.requestAnimationFrame(sample)
      }

      frameId = window.requestAnimationFrame(sample)
    }

    const existingCanvas = document.querySelector("canvas")
    if (existingCanvas) {
      runWarmupSample()
    } else if (document.body) {
      observer = new MutationObserver(() => {
        if (document.querySelector("canvas")) {
          runWarmupSample()
        }
      })
      observer.observe(document.body, { childList: true, subtree: true })
    }

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId)
      observer?.disconnect()
    }
  }, [detected.webglSupported, setRenderProfile])

  useEffect(() => {
    if (typeof document === "undefined") return

    const handleContextLost = (event: Event) => {
      const target = event.target
      if (!(target instanceof HTMLCanvasElement)) return
      if ("preventDefault" in event && typeof event.preventDefault === "function") {
        event.preventDefault()
      }

      setContextLossCount((prev) => {
        const nextCount = prev + 1
        setRenderProfile(nextCount >= 2 ? "fallback2d" : "reduced3d")
        return nextCount
      })
    }

    const handleContextRestored = (_event: Event) => {
      // Intentionally no auto-upgrade. Hysteresis keeps the session stable.
    }

    document.addEventListener("webglcontextlost", handleContextLost, true)
    document.addEventListener("webglcontextrestored", handleContextRestored, true)

    return () => {
      document.removeEventListener("webglcontextlost", handleContextLost, true)
      document.removeEventListener("webglcontextrestored", handleContextRestored, true)
    }
  }, [setRenderProfile])

  const value = useMemo<GraphicsCapabilityContextValue>(() => ({
    renderProfile: renderProfileState,
    setRenderProfile,
    webglSupported: detected.webglSupported,
    contextLossCount,
  }), [contextLossCount, detected.webglSupported, renderProfileState, setRenderProfile])

  return (
    <GraphicsCapabilityContext.Provider value={value}>
      {children}
    </GraphicsCapabilityContext.Provider>
  )
}

export default GraphicsCapabilityProvider
