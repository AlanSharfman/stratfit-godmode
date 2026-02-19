import { useCallback, useMemo } from "react"
import { createSeed } from "@/terrain/seed"
import { sampleTerrainHeight } from "@/terrain/buildTerrain"
import { getStmEnabled, sampleStmDisplacement } from "@/render/stm/stmRuntime"

export function useTerrainHeight(scenarioId: string = "baseline") {
  const seed = useMemo(() => createSeed(scenarioId), [scenarioId])

  return useCallback(
    (x: number, z: number) => {
      const base = sampleTerrainHeight(x, z, seed)
      const stm = getStmEnabled() ? sampleStmDisplacement(x, z) : 0
      return base + stm
    },
    [seed]
  )
}
