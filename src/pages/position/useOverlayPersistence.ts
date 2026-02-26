import { useEffect } from "react"
import { useRenderFlagsStore } from "@/state/renderFlagsStore"

const STORAGE_KEY = "sf.position.overlays.v1"

type Persisted = Partial<{
  showMarkers: boolean
  showPaths: boolean
  showFlow: boolean
  showGrid: boolean
}>

export default function useOverlayPersistence() {
  const showMarkers = useRenderFlagsStore((s) => s.showMarkers)
  const showPaths = useRenderFlagsStore((s) => s.showPaths)
  const showFlow = useRenderFlagsStore((s) => s.showFlow)
  const showGrid = useRenderFlagsStore((s) => s.showGrid)
  const set = useRenderFlagsStore((s) => s.set)

  // hydrate once
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved) as Persisted
      if (typeof parsed.showMarkers === "boolean") set("showMarkers", parsed.showMarkers)
      if (typeof parsed.showPaths === "boolean") set("showPaths", parsed.showPaths)
      if (typeof parsed.showFlow === "boolean") set("showFlow", parsed.showFlow)
      if (typeof parsed.showGrid === "boolean") set("showGrid", parsed.showGrid)
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // persist
  useEffect(() => {
    const payload: Persisted = { showMarkers, showPaths, showFlow, showGrid }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }, [showMarkers, showPaths, showFlow, showGrid])
}
