import { useEffect } from "react"
import { useRenderFlagsStore } from "@/state/renderFlagsStore"

const STORAGE_KEY = "sf.position.overlays.v1"

export default function useOverlayPersistence() {
  const state = useRenderFlagsStore()

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      useRenderFlagsStore.setState(parsed)
    } catch {}
  }, [])

  useEffect(() => {
    const { showMarkers, showPaths, showTicks } = state
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ showMarkers, showPaths, showTicks })
    )
  }, [state.showMarkers, state.showPaths, state.showTicks])
}
