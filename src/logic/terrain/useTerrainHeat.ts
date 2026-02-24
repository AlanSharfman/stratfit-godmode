import { useMemo } from "react"
import { useLavaIntensity } from "@/logic/lava/useLavaIntensity"
import { useSignalDrivenLavaIntensity } from "@/logic/lava/useSignalDrivenLavaIntensity"

/**
 * Terrain heat adapter
 *
 * Combines:
 * 1) canonical lava (engine derived)
 * 2) strategic stress (signals)
 *
 * Returns normalized 0–1 heat value
 */
export function useTerrainHeat() {
  const canonical = useLavaIntensity()
  const signalHeat = useSignalDrivenLavaIntensity()

  return useMemo(() => {
    const base = canonical?.overall ?? 0
    return Math.max(0, Math.min(1, Math.max(base, signalHeat)))
  }, [canonical?.overall, signalHeat])
}
